// Lectures de l'administration (toujours appelées après requireAdmin()).
import 'server-only';
import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, or, sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import {
  categories,
  categoryTranslations,
  contactMessages,
  dishTranslations,
  dishes,
  reservations,
  type ReservationStatus,
} from '@/lib/db/schema';
import { ACTIVE_STATUSES } from '@/lib/reservations/service';
import { addDays, restaurantNow } from '@/lib/reservations/time';

export async function navCounts() {
  const db = await getDb();
  const today = restaurantNow().date;
  const [[pending], [unread]] = await Promise.all([
    db
      .select({ n: count() })
      .from(reservations)
      .where(and(eq(reservations.status, 'pending'), gte(reservations.date, today))),
    db.select({ n: count() }).from(contactMessages).where(isNull(contactMessages.readAt)),
  ]);
  return { pending: pending?.n ?? 0, unread: unread?.n ?? 0 };
}

export interface DayCovers {
  date: string;
  lunch: number;
  dinner: number;
  bookings: number;
}

export async function dashboard(days = 14) {
  const db = await getDb();
  const today = restaurantNow().date;
  const end = addDays(today, days - 1);

  const [perDay, todayList, pendingList, failures] = await Promise.all([
    db
      .select({
        date: reservations.date,
        service: reservations.service,
        covers: sql<number>`sum(${reservations.guests})::int`,
        bookings: sql<number>`count(*)::int`,
      })
      .from(reservations)
      .where(
        and(gte(reservations.date, today), lte(reservations.date, end), inArray(reservations.status, ACTIVE_STATUSES)),
      )
      .groupBy(reservations.date, reservations.service),
    db
      .select()
      .from(reservations)
      .where(
        and(eq(reservations.date, today), inArray(reservations.status, [...ACTIVE_STATUSES, 'completed', 'no_show'])),
      )
      .orderBy(asc(reservations.time), asc(reservations.id)),
    db
      .select()
      .from(reservations)
      .where(and(eq(reservations.status, 'pending'), gte(reservations.date, today)))
      .orderBy(asc(reservations.date), asc(reservations.time))
      .limit(8),
    db
      .select({ n: count() })
      .from(reservations)
      .where(and(isNotNull(reservations.lastEmailError), gte(reservations.date, today))),
  ]);

  const series: DayCovers[] = Array.from({ length: days }, (_, i) => ({
    date: addDays(today, i),
    lunch: 0,
    dinner: 0,
    bookings: 0,
  }));
  for (const row of perDay) {
    const day = series.find((d) => d.date === row.date);
    if (!day) continue;
    day[row.service] += Number(row.covers) || 0;
    day.bookings += Number(row.bookings) || 0;
  }

  const active = todayList.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const coversToday = { lunch: 0, dinner: 0 };
  for (const r of active) coversToday[r.service] += r.guests;
  const week = series.slice(0, 7);

  return {
    today,
    series,
    todayList,
    pendingList,
    emailFailures: failures[0]?.n ?? 0,
    kpis: {
      bookingsToday: active.length,
      coversToday,
      pending: pendingList.length,
      coversWeek: week.reduce((s, d) => s + d.lunch + d.dinner, 0),
      bookingsWeek: week.reduce((s, d) => s + d.bookings, 0),
    },
  };
}

export type ReservationRange = 'today' | 'tomorrow' | 'week' | 'upcoming' | 'past' | 'all';

export async function listReservations({
  range = 'upcoming',
  status,
  q,
}: {
  range?: ReservationRange;
  status?: ReservationStatus;
  q?: string;
}) {
  const db = await getDb();
  const today = restaurantNow().date;
  const filters: (SQL | undefined)[] = [];
  if (range === 'today') filters.push(eq(reservations.date, today));
  if (range === 'tomorrow') filters.push(eq(reservations.date, addDays(today, 1)));
  if (range === 'week') filters.push(gte(reservations.date, today), lte(reservations.date, addDays(today, 6)));
  if (range === 'upcoming') filters.push(gte(reservations.date, today));
  if (range === 'past') filters.push(sql`${reservations.date} < ${today}`);
  if (status) filters.push(eq(reservations.status, status));
  if (q && q.trim()) {
    const term = `%${q.trim().replace(/[%_\\]/g, '\\$&')}%`;
    filters.push(
      or(
        ilike(reservations.firstName, term),
        ilike(reservations.lastName, term),
        ilike(reservations.email, term),
        ilike(reservations.phone, term),
        ilike(reservations.reference, term),
      ),
    );
  }
  return db
    .select()
    .from(reservations)
    .where(and(...filters))
    .orderBy(
      range === 'past' ? desc(reservations.date) : asc(reservations.date),
      asc(reservations.time),
      asc(reservations.id),
    )
    .limit(300);
}

export async function listMessages() {
  const db = await getDb();
  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200);
}

export interface AdminDish {
  id: number;
  categoryId: number;
  slug: string;
  price: number;
  image: string | null;
  allergens: string[];
  tags: string[];
  isSignature: boolean;
  isAvailable: boolean;
  position: number;
  fr: { name: string; description: string };
  en: { name: string; description: string };
}

export interface AdminCategory {
  id: number;
  slug: string;
  position: number;
  fr: { name: string; description: string };
  en: { name: string; description: string };
  dishes: AdminDish[];
}

/** Carte complète avec les deux langues, pour l'édition. */
export async function adminMenu(): Promise<AdminCategory[]> {
  const db = await getDb();
  const [cats, catTr, dishRows, dishTr] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.position), asc(categories.id)),
    db.select().from(categoryTranslations),
    db.select().from(dishes).orderBy(asc(dishes.position), asc(dishes.id)),
    db.select().from(dishTranslations),
  ]);
  const tr = <T extends { locale: string; name: string; description: string }>(rows: T[], locale: 'fr' | 'en') => {
    const row = rows.find((r) => r.locale === locale);
    return { name: row?.name ?? '', description: row?.description ?? '' };
  };
  return cats.map((c) => {
    const ct = catTr.filter((t) => t.categoryId === c.id);
    return {
      id: c.id,
      slug: c.slug,
      position: c.position,
      fr: tr(ct, 'fr'),
      en: tr(ct, 'en'),
      dishes: dishRows
        .filter((d) => d.categoryId === c.id)
        .map((d) => {
          const dt = dishTr.filter((t) => t.dishId === d.id);
          return {
            id: d.id,
            categoryId: d.categoryId,
            slug: d.slug,
            price: d.price,
            image: d.image,
            allergens: d.allergens,
            tags: d.tags,
            isSignature: d.isSignature,
            isAvailable: d.isAvailable,
            position: d.position,
            fr: tr(dt, 'fr'),
            en: tr(dt, 'en'),
          };
        }),
    };
  });
}
