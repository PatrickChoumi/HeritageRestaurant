// Remplissage initial de la base (idempotent) : carte, et en local des réservations fictives
// pour que le tableau de bord de démonstration ne soit pas vide.
import { count, eq } from 'drizzle-orm';
import type { Db } from './types';
import { seedMenu } from './seed-data';
import {
  adminUsers,
  categories,
  categoryTranslations,
  dishTranslations,
  dishes,
  reservations,
  type ReservationStatus,
} from './schema';
import { addDays, restaurantNow, servicesFor } from '@/lib/reservations/time';
import { generateReference } from '@/lib/reservations/reference';

export async function seedMenuIfEmpty(db: Db): Promise<boolean> {
  const [{ value } = { value: 0 }] = await db.select({ value: count() }).from(categories);
  if (value > 0) return false;

  await db.transaction(async (tx) => {
    for (const [ci, category] of seedMenu.entries()) {
      const [created] = await tx
        .insert(categories)
        .values({ slug: category.slug, position: ci })
        .returning({ id: categories.id });
      const categoryId = created!.id;
      await tx.insert(categoryTranslations).values([
        { categoryId, locale: 'fr', ...category.fr },
        { categoryId, locale: 'en', ...category.en },
      ]);
      for (const [di, dish] of category.dishes.entries()) {
        const [d] = await tx
          .insert(dishes)
          .values({
            categoryId,
            slug: dish.slug,
            price: dish.price,
            image: dish.image ?? null,
            allergens: dish.allergens ?? [],
            tags: dish.tags ?? [],
            isSignature: dish.signature ?? false,
            isAvailable: dish.available ?? true,
            position: di,
          })
          .returning({ id: dishes.id });
        await tx.insert(dishTranslations).values([
          { dishId: d!.id, locale: 'fr', ...dish.fr },
          { dishId: d!.id, locale: 'en', ...dish.en },
        ]);
      }
    }
  });
  return true;
}

// Clients fictifs (adresses example.com : aucun e-mail réel ne peut partir).
const DEMO_GUESTS = [
  ['Aïcha', 'Mbarga'],
  ['Jean-Paul', 'Ngono'],
  ['Claire', 'Dubois'],
  ['Samuel', 'Eto’o Fils'],
  ['Mireille', 'Atangana'],
  ['David', 'Thompson'],
  ['Brenda', 'Fon'],
  ['Hervé', 'Kamga'],
  ['Laura', 'Bianchi'],
  ['Patrice', 'Essomba'],
  ['Nadia', 'Moukoko'],
  ['Kevin', 'Tchoua'],
] as const;

const DEMO_REQUESTS = [
  'Anniversaire de mariage, une table calme si possible.',
  'Une chaise haute pour un enfant de 2 ans.',
  'Allergie aux arachides pour une personne.',
  null,
  null,
  'Dîner d’affaires, nous aurons besoin de la facture au nom de la société.',
] as const;

export async function seedDemoReservationsIfEmpty(db: Db): Promise<boolean> {
  const [{ value } = { value: 0 }] = await db.select({ value: count() }).from(reservations);
  if (value > 0) return false;

  const today = restaurantNow().date;
  const rows: (typeof reservations.$inferInsert)[] = [];
  let n = 0;
  for (let day = -2; day <= 9; day += 1) {
    const date = addDays(today, day);
    const services = servicesFor(date);
    for (const service of services) {
      const perService = service.id === 'dinner' ? 3 + ((day + 7) % 3) : 1 + ((day + 7) % 2);
      for (let i = 0; i < perService; i += 1) {
        const [firstName, lastName] = DEMO_GUESTS[n % DEMO_GUESTS.length]!;
        const time = service.slots[(i * 2 + day + 7) % service.slots.length]!;
        let status: ReservationStatus = day < 0 ? 'completed' : n % 4 === 0 ? 'pending' : 'confirmed';
        if (day < 0 && n % 7 === 0) status = 'no_show';
        if (day >= 0 && n % 11 === 5) status = 'cancelled';
        rows.push({
          reference: generateReference(),
          date,
          time,
          service: service.id,
          guests: 2 + ((n * 3) % 5),
          firstName,
          lastName,
          email: `${firstName}.${lastName}`
            .normalize('NFD')
            .replace(/[^a-zA-Z.]/g, '')
            .toLowerCase()
            .concat('@example.com'),
          phone: `+2376${String(70000000 + n * 1234567).slice(0, 8)}`,
          occasion: n % 5 === 0 ? 'birthday' : n % 6 === 0 ? 'business' : null,
          requests: DEMO_REQUESTS[n % DEMO_REQUESTS.length] ?? null,
          locale: n % 4 === 2 ? 'en' : 'fr',
          status,
          clientEmailSentAt: new Date(),
          restaurantEmailSentAt: new Date(),
          emailAttempts: 1,
        });
        n += 1;
      }
    }
  }
  await db.insert(reservations).values(rows);
  return true;
}

export async function adminCount(db: Db): Promise<number> {
  const [{ value } = { value: 0 }] = await db.select({ value: count() }).from(adminUsers);
  return value;
}

export async function findAdminByEmail(db: Db, email: string) {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase()));
  return user;
}
