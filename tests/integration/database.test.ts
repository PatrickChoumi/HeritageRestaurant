// Tests sur une vraie base PostgreSQL : PGlite en mémoire par défaut, ou DATABASE_URL (CI).
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { dishTranslations, dishes, rateLimits, reservations } from '@/lib/db/schema';
import { seedMenuIfEmpty } from '@/lib/db/seed';
import { createReservation, getAvailability } from '@/lib/reservations/service';
import { getMenu, getSignatureDishes } from '@/lib/menu';
import { rateLimit } from '@/lib/rate-limit';
import { addDays, restaurantNow } from '@/lib/reservations/time';
import { restaurant } from '@/lib/restaurant';
import type { ReservationData } from '@/lib/reservations/validation';

// Un mardi de la fenêtre de réservation, loin du jour courant
const DATE = (() => {
  let d = addDays(restaurantNow().date, 10);
  while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 2) d = addDays(d, 1);
  return d;
})();

const booking = (overrides: Partial<ReservationData> = {}): ReservationData => ({
  date: DATE,
  time: '20:00',
  guests: 4,
  firstName: 'Test',
  lastName: 'Client',
  email: 'test@example.com',
  phone: '+237659855617',
  consent: true,
  locale: 'fr',
  ...overrides,
});

beforeAll(async () => {
  const db = await getDb();
  await seedMenuIfEmpty(db);
});

beforeEach(async () => {
  const db = await getDb();
  await db.delete(reservations);
  await db.delete(rateLimits);
});

describe('réservations', () => {
  it('enregistre une réservation avec une référence unique, en attente de confirmation', async () => {
    const result = await createReservation(booking());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reservation.reference).toMatch(/^HER-[A-Z2-9]{6}$/);
    expect(result.reservation).toMatchObject({ status: 'pending', service: 'dinner', guests: 4, date: DATE });
  });

  it('refuse un créneau complet et met à jour les disponibilités', async () => {
    const { capacityPerSlot } = restaurant.reservation;
    for (let filled = 0; filled + 8 <= capacityPerSlot; filled += 8) {
      expect((await createReservation(booking({ guests: 8 }))).ok).toBe(true);
    }
    const availability = await getAvailability(DATE, 4);
    const slot = availability.services.find((s) => s.id === 'dinner')!.slots.find((s) => s.time === '20:00')!;
    expect(slot.status).toBe('full');
    expect(await createReservation(booking({ guests: 4 }))).toEqual({ ok: false, error: 'full' });
    // Les autres créneaux restent ouverts
    expect((await createReservation(booking({ time: '20:30' }))).ok).toBe(true);
  });

  it('ne survend jamais la dernière table, même avec des demandes simultanées', async () => {
    const { capacityPerSlot } = restaurant.reservation;
    await createReservation(booking({ guests: 10 }));
    await createReservation(booking({ guests: capacityPerSlot - 10 - 4 })); // il reste 4 places
    const results = await Promise.all(Array.from({ length: 5 }, () => createReservation(booking({ guests: 4 }))));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const db = await getDb();
    const [{ total } = { total: 0 }] = await db
      .select({ total: sql<number>`sum(${reservations.guests})::int` })
      .from(reservations)
      .where(eq(reservations.time, '20:00'));
    expect(total).toBe(capacityPerSlot);
  });

  it('libère les places d’une réservation annulée', async () => {
    const { capacityPerSlot, maxGuestsOnline } = restaurant.reservation;
    const ids: number[] = [];
    for (let left = capacityPerSlot; left > 0; left -= maxGuestsOnline) {
      const r = await createReservation(booking({ guests: Math.min(left, maxGuestsOnline) }));
      expect(r.ok).toBe(true);
      if (r.ok) ids.push(r.reservation.id);
    }
    expect((await createReservation(booking({ guests: 2 }))).ok).toBe(false);
    const db = await getDb();
    await db.update(reservations).set({ status: 'cancelled' }).where(eq(reservations.id, ids[0]!));
    expect((await createReservation(booking({ guests: 2 }))).ok).toBe(true);
  });

  it('applique les règles métier côté serveur, quelle que soit la requête', async () => {
    expect(await createReservation(booking({ time: '16:00' }))).toEqual({ ok: false, error: 'slotInvalid' });
    expect(await createReservation(booking({ date: addDays(restaurantNow().date, -1) }))).toEqual({
      ok: false,
      error: 'datePast',
    });
  });
});

describe('carte bilingue', () => {
  it('renvoie les catégories et plats traduits depuis la base', async () => {
    const fr = await getMenu('fr');
    const en = await getMenu('en');
    expect(fr.map((c) => c.name)).toEqual(['Entrées', 'Plats', 'Desserts', 'Boissons & Vins']);
    expect(en.map((c) => c.name)).toEqual(['Starters', 'Mains', 'Desserts', 'Drinks & Wines']);
    expect(en[1]!.dishes.find((d) => d.slug === 'ndole-aux-crevettes')!.name).toBe('Ndolé with prawns');
  });

  it('se replie sur le français quand une traduction anglaise manque', async () => {
    const db = await getDb();
    const [dish] = await db.select().from(dishes).where(eq(dishes.slug, 'eru-water-fufu'));
    await db
      .delete(dishTranslations)
      .where(sql`${dishTranslations.dishId} = ${dish!.id} and ${dishTranslations.locale} = 'en'`);
    const en = await getMenu('en');
    expect(en.flatMap((c) => c.dishes).find((d) => d.slug === 'eru-water-fufu')!.name).toBe('Eru & water fufu');
  });

  it('met en avant les plats signatures avec photo, disponibles d’abord', async () => {
    const signatures = await getSignatureDishes('fr');
    expect(signatures.length).toBeGreaterThan(0);
    expect(signatures.every((d) => d.isSignature && d.image)).toBe(true);
  });

  it('expose allergènes et indisponibilité', async () => {
    const plats = (await getMenu('fr')).find((c) => c.slug === 'plats')!;
    expect(plats.dishes.find((d) => d.slug === 'ndole-aux-crevettes')!.allergens).toEqual(['peanuts', 'crustaceans']);
    expect(plats.dishes.find((d) => d.slug === 'taro-sauce-jaune')!.isAvailable).toBe(false);
  });
});

describe('limitation de débit', () => {
  it('bloque au-delà du seuil puis se réinitialise après la fenêtre', async () => {
    for (let i = 0; i < 3; i += 1) expect((await rateLimit('test:key', 3, 60)).allowed).toBe(true);
    expect((await rateLimit('test:key', 3, 60)).allowed).toBe(false);
    const db = await getDb();
    await db.update(rateLimits).set({ resetAt: new Date(Date.now() - 1000) });
    expect((await rateLimit('test:key', 3, 60)).allowed).toBe(true);
  });
});
