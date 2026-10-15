'use server';

// Actions de l'administration. Chacune vérifie la session (requireAdmin) : la protection ne repose
// jamais seulement sur la page. Next.js refuse les appels d'une autre origine (protection CSRF).
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import {
  adminUsers,
  categories,
  categoryTranslations,
  contactMessages,
  dishTranslations,
  dishes,
  reservations,
  reservationStatusEnum,
} from '@/lib/db/schema';
import { createSession, destroyOtherSessions, destroySession, requireAdmin } from '@/lib/auth/session';
import { hashPassword, PASSWORD_MIN_LENGTH, verifyAgainstDummy, verifyPassword } from '@/lib/auth/password';
import { clientFingerprint, rateLimit } from '@/lib/rate-limit';
import { notifyNewReservation, notifyStatusChange } from '@/lib/reservations/notify';
import { ALLERGENS, TAGS } from '@/lib/menu-codes';
import { dishImageKeys } from '@/lib/images';
import { cleanMultiline, cleanText } from '@/lib/reservations/validation';

/* ------------------------------------------------------------ Connexion */

export interface LoginState {
  error?: 'invalid' | 'rateLimited';
  /** Renvoyé pour pré-remplir le champ après un échec (React vide le formulaire). */
  email?: string;
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : '';
  // Uniquement un chemin interne de l'administration (pas de redirection ouverte)
  return /^\/admin(\/[\w\-/?=&%.]*)?$/.test(next) && !next.startsWith('/admin/login') ? next : '/admin';
}

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 254);
  const password = String(formData.get('password') ?? '').slice(0, 200);

  const [byIp, byAccount] = await Promise.all([
    rateLimit(`login:ip:${await clientFingerprint()}`, 5, 15 * 60),
    rateLimit(`login:account:${email}`, 10, 15 * 60),
  ]);
  if (!byIp.allowed || !byAccount.allowed) return { error: 'rateLimited', email };

  const db = await getDb();
  const [user] = email ? await db.select().from(adminUsers).where(eq(adminUsers.email, email)) : [];
  // Même durée de vérification que le compte existe ou non
  const valid = user ? await verifyPassword(password, user.passwordHash) : await verifyAgainstDummy(password);
  if (!user || !valid) {
    console.warn('[admin] échec de connexion');
    return { error: 'invalid', email };
  }
  await createSession(user.id);
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  redirect(safeNext(formData.get('next')));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/admin/login');
}

export interface PasswordState {
  ok?: boolean;
  error?: 'current' | 'tooShort' | 'mismatch' | 'same';
}

export async function changePasswordAction(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await requireAdmin();
  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  const db = await getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.user.id));
  if (!user || !(await verifyPassword(current, user.passwordHash))) return { error: 'current' };
  if (next.length < PASSWORD_MIN_LENGTH) return { error: 'tooShort' };
  if (next !== confirm) return { error: 'mismatch' };
  if (next === current) return { error: 'same' };
  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(adminUsers.id, user.id));
  await destroyOtherSessions(session);
  return { ok: true };
}

/* --------------------------------------------------------- Réservations */

const statusSchema = z.enum(reservationStatusEnum.enumValues);

export async function setReservationStatus(
  id: number,
  status: string,
  notify: boolean,
): Promise<{ ok: boolean; emailed?: boolean; error?: string }> {
  await requireAdmin();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success || !Number.isInteger(id)) return { ok: false, error: 'invalid' };
  const db = await getDb();
  const [updated] = await db
    .update(reservations)
    .set({ status: parsed.data })
    .where(eq(reservations.id, id))
    .returning();
  if (!updated) return { ok: false, error: 'notFound' };

  let emailed = false;
  if (notify && (parsed.data === 'confirmed' || parsed.data === 'cancelled')) {
    try {
      await notifyStatusChange(updated, parsed.data);
      emailed = true;
    } catch (error) {
      console.error('[admin] e-mail de statut non envoyé :', error);
    }
  }
  revalidatePath('/admin', 'layout');
  return { ok: true, emailed };
}

export async function saveInternalNote(id: number, note: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { ok: false };
  const db = await getDb();
  const clean = cleanMultiline(String(note)).slice(0, 1000);
  await db
    .update(reservations)
    .set({ internalNote: clean || null })
    .where(eq(reservations.id, id));
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

/** Renvoie les notifications (e-mail client + alerte établissement) d'une réservation. */
export async function resendNotifications(id: number): Promise<{ ok: boolean; error?: string | null }> {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db
    .update(reservations)
    .set({ clientEmailSentAt: null, restaurantEmailSentAt: null })
    .where(eq(reservations.id, id))
    .returning();
  if (!row) return { ok: false, error: 'notFound' };
  await notifyNewReservation(row);
  const [after] = await db
    .select({ error: reservations.lastEmailError })
    .from(reservations)
    .where(eq(reservations.id, id));
  revalidatePath('/admin', 'layout');
  return { ok: !after?.error, error: after?.error };
}

/* ------------------------------------------------------------- Messages */

export async function setMessageRead(id: number, read: boolean): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db
    .update(contactMessages)
    .set({ readAt: read ? new Date() : null })
    .where(eq(contactMessages.id, id));
  revalidatePath('/admin', 'layout');
}

/* ---------------------------------------------------------------- Carte */

/** Après une modification de la carte, les pages publiques sont régénérées immédiatement. */
function refreshPublicSite() {
  revalidatePath('/', 'layout');
}

export async function toggleDish(id: number, field: 'isAvailable' | 'isSignature'): Promise<void> {
  await requireAdmin();
  if (field !== 'isAvailable' && field !== 'isSignature') return;
  const db = await getDb();
  const column = field === 'isAvailable' ? dishes.isAvailable : dishes.isSignature;
  await db
    .update(dishes)
    .set({ [field]: sql`not ${column}` })
    .where(eq(dishes.id, id));
  refreshPublicSite();
}

const text = (max: number, min = 0) => z.string().transform(cleanText).pipe(z.string().min(min).max(max));
const longText = (max: number) => z.string().transform(cleanMultiline).pipe(z.string().max(max));

const dishSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive(),
  price: z.coerce.number().int().min(0).max(5_000_000),
  image: z
    .string()
    .optional()
    .transform((v) => (v && (dishImageKeys as string[]).includes(v) ? v : null)),
  allergens: z.array(z.enum(ALLERGENS)),
  tags: z.array(z.enum(TAGS)),
  isSignature: z.boolean(),
  isAvailable: z.boolean(),
  nameFr: text(120, 2),
  nameEn: text(120),
  descriptionFr: longText(600),
  descriptionEn: longText(600),
});

export interface DishFormState {
  ok?: boolean;
  errors?: Partial<Record<keyof z.input<typeof dishSchema>, string>>;
}

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70) || 'plat'
  );
}

export async function saveDishAction(_: DishFormState, formData: FormData): Promise<DishFormState> {
  await requireAdmin();
  const parsed = dishSchema.safeParse({
    id: formData.get('id') || undefined,
    categoryId: formData.get('categoryId'),
    price: formData.get('price'),
    image: formData.get('image') ?? undefined,
    allergens: formData.getAll('allergens').map(String),
    tags: formData.getAll('tags').map(String),
    isSignature: formData.get('isSignature') === 'on',
    isAvailable: formData.get('isAvailable') === 'on',
    nameFr: String(formData.get('nameFr') ?? ''),
    nameEn: String(formData.get('nameEn') ?? ''),
    descriptionFr: String(formData.get('descriptionFr') ?? ''),
    descriptionEn: String(formData.get('descriptionEn') ?? ''),
  });
  if (!parsed.success) {
    const errors: DishFormState['errors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<DishFormState['errors']>;
      errors[key] ??= 'invalid';
    }
    return { errors };
  }
  const d = parsed.data;
  const db = await getDb();
  const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, d.categoryId));
  if (!category) return { errors: { categoryId: 'invalid' } };

  await db.transaction(async (tx) => {
    const values = {
      categoryId: d.categoryId,
      price: d.price,
      image: d.image,
      allergens: d.allergens,
      tags: d.tags,
      isSignature: d.isSignature,
      isAvailable: d.isAvailable,
    };
    let dishId = d.id;
    if (dishId) {
      await tx.update(dishes).set(values).where(eq(dishes.id, dishId));
    } else {
      const base = slugify(d.nameFr);
      let slug = base;
      for (let n = 2; ; n += 1) {
        const [taken] = await tx.select({ id: dishes.id }).from(dishes).where(eq(dishes.slug, slug));
        if (!taken) break;
        slug = `${base}-${n}`;
      }
      const [{ max } = { max: 0 }] = await tx
        .select({ max: sql<number>`coalesce(max(${dishes.position}), -1)::int + 1` })
        .from(dishes)
        .where(eq(dishes.categoryId, d.categoryId));
      const [created] = await tx
        .insert(dishes)
        .values({ ...values, slug, position: max })
        .returning({ id: dishes.id });
      dishId = created!.id;
    }
    for (const [locale, name, description] of [
      ['fr', d.nameFr, d.descriptionFr],
      ['en', d.nameEn, d.descriptionEn],
    ] as const) {
      if (!name) {
        // Sans traduction anglaise, le site affiche le français
        await tx
          .delete(dishTranslations)
          .where(and(eq(dishTranslations.dishId, dishId), eq(dishTranslations.locale, locale)));
        continue;
      }
      await tx
        .insert(dishTranslations)
        .values({ dishId, locale, name, description })
        .onConflictDoUpdate({ target: [dishTranslations.dishId, dishTranslations.locale], set: { name, description } });
    }
  });
  refreshPublicSite();
  redirect('/admin/carte?saved=1');
}

export async function deleteDish(id: number): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(dishes).where(eq(dishes.id, id));
  refreshPublicSite();
}

/** Déplace un plat d'un cran dans sa catégorie (échange de position avec son voisin). */
export async function moveDish(id: number, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
  if (!dish) return;
  const siblings = await db
    .select({ id: dishes.id, position: dishes.position })
    .from(dishes)
    .where(eq(dishes.categoryId, dish.categoryId))
    .orderBy(dishes.position, dishes.id);
  const index = siblings.findIndex((s) => s.id === id);
  const target = siblings[index + direction];
  if (!target) return;
  await db.transaction(async (tx) => {
    // Renumérotation propre puis échange
    for (const [i, s] of siblings.entries()) await tx.update(dishes).set({ position: i }).where(eq(dishes.id, s.id));
    await tx
      .update(dishes)
      .set({ position: index + direction })
      .where(eq(dishes.id, id));
    await tx.update(dishes).set({ position: index }).where(eq(dishes.id, target.id));
  });
  refreshPublicSite();
}

const categorySchema = z.object({
  id: z.coerce.number().int().positive(),
  nameFr: text(80, 2),
  nameEn: text(80, 2),
  descriptionFr: longText(300),
  descriptionEn: longText(300),
});

export interface CategoryFormState {
  ok?: boolean;
  error?: boolean;
}

export async function saveCategoryAction(_: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: true };
  const c = parsed.data;
  const db = await getDb();
  for (const [locale, name, description] of [
    ['fr', c.nameFr, c.descriptionFr],
    ['en', c.nameEn, c.descriptionEn],
  ] as const) {
    await db
      .insert(categoryTranslations)
      .values({ categoryId: c.id, locale, name, description })
      .onConflictDoUpdate({
        target: [categoryTranslations.categoryId, categoryTranslations.locale],
        set: { name, description },
      });
  }
  refreshPublicSite();
  return { ok: true };
}
