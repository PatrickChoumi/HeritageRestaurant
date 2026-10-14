// Réservations : disponibilités et enregistrement, avec contrôle de capacité transactionnel.
import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb, type Db } from '@/lib/db/client';
import { reservations, type ReservationStatus } from '@/lib/db/schema';
import { generateReference } from './reference';
import {
  checkBookable,
  computeAvailability,
  remainingFor,
  restaurantNow,
  serviceOf,
  type Availability,
  type BookedCovers,
  type BookingError,
} from './time';
import type { ReservationData } from './validation';

/** Statuts qui occupent une table. */
export const ACTIVE_STATUSES: ReservationStatus[] = ['pending', 'confirmed'];

type Executor = Pick<Db, 'select'>;

export async function bookedCovers(db: Executor, date: string): Promise<BookedCovers> {
  const rows = await db
    .select({
      time: reservations.time,
      service: reservations.service,
      covers: sql<number>`sum(${reservations.guests})::int`,
    })
    .from(reservations)
    .where(and(eq(reservations.date, date), inArray(reservations.status, ACTIVE_STATUSES)))
    .groupBy(reservations.time, reservations.service);

  const booked: BookedCovers = { bySlot: {}, byService: {} };
  for (const row of rows) {
    const covers = Number(row.covers) || 0;
    booked.bySlot[row.time] = (booked.bySlot[row.time] ?? 0) + covers;
    booked.byService[row.service] = (booked.byService[row.service] ?? 0) + covers;
  }
  return booked;
}

export async function getAvailability(date: string, guests: number): Promise<Availability> {
  const db = await getDb();
  return computeAvailability(date, guests, await bookedCovers(db, date));
}

export type Reservation = typeof reservations.$inferSelect;

export type CreateResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; error: BookingError | 'full' };

/**
 * Enregistre une réservation. Un verrou PostgreSQL par date sérialise les demandes simultanées :
 * deux clients ne peuvent pas obtenir la dernière table du même créneau.
 */
export async function createReservation(data: ReservationData): Promise<CreateResult> {
  const now = restaurantNow();
  const rule = checkBookable(data.date, data.time, data.guests, now);
  if (rule) return { ok: false, error: rule };
  const service = serviceOf(data.date, data.time)!;

  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`reservation:${data.date}`}))`);
    const booked = await bookedCovers(tx, data.date);
    if (remainingFor(service, data.time, booked) < data.guests) return { ok: false, error: 'full' } as const;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reference = generateReference();
      const [created] = await tx
        .insert(reservations)
        .values({
          reference,
          date: data.date,
          time: data.time,
          service,
          guests: data.guests,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          occasion: data.occasion ?? null,
          requests: data.requests || null,
          locale: data.locale,
          status: process.env.RESERVATION_AUTO_CONFIRM === 'true' ? 'confirmed' : 'pending',
        })
        .onConflictDoNothing({ target: reservations.reference })
        .returning();
      if (created) return { ok: true, reservation: created } as const;
    }
    throw new Error('Impossible de générer une référence de réservation unique');
  });
}

export async function getReservation(id: number): Promise<Reservation | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(reservations).where(eq(reservations.id, id));
  return row;
}
