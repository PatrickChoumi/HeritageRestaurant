'use server';

import { after } from 'next/server';
import { rateLimit, clientFingerprint } from '@/lib/rate-limit';
import { createReservation } from '@/lib/reservations/service';
import { notifyNewReservation, retryPendingNotifications, toEmailData } from '@/lib/reservations/notify';
import { fieldErrors, reservationSchema } from '@/lib/reservations/validation';
import { generateReference } from '@/lib/reservations/reference';
import { reservationWhatsAppText } from '@/lib/email/templates';
import { whatsappUrl } from '@/lib/restaurant';
import { serviceOf, type BookingError } from '@/lib/reservations/time';

export type BookingFailure = BookingError | 'full' | 'rateLimited' | 'server';

export type BookingResult =
  | {
      ok: true;
      reference: string;
      whatsappUrl: string;
      email: string;
      firstName: string;
      lastName: string;
      date: string;
      time: string;
      guests: number;
      service: 'lunch' | 'dinner';
    }
  | { ok: false; fieldErrors?: Record<string, string>; error?: BookingFailure };

/** Délai minimum de remplissage : un humain met bien plus de 3 secondes. */
const MIN_FILL_MS = 3000;

/**
 * Server Action : enregistre la réservation (SQL), puis, une fois la réponse envoyée au navigateur,
 * envoie les e-mails client + établissement. Next.js vérifie l'origine de chaque appel (protection CSRF).
 */
export async function submitReservation(input: unknown): Promise<BookingResult> {
  try {
    const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

    // Robots : champ piège rempli ou formulaire envoyé instantanément → fausse réussite, rien n'est enregistré
    const isBot =
      (typeof raw.website === 'string' && raw.website.trim() !== '') ||
      (typeof raw.elapsed === 'number' && raw.elapsed < MIN_FILL_MS);
    const parsed = reservationSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    const data = parsed.data;
    if (isBot) {
      console.warn('[réservation] envoi ignoré (robot présumé)');
      return { ok: true, reference: generateReference(), whatsappUrl: whatsappUrl(), ...summaryOf(data) };
    }

    const limit = await rateLimit(`booking:${await clientFingerprint()}`, 6, 10 * 60);
    if (!limit.allowed) return { ok: false, error: 'rateLimited' };

    const result = await createReservation(data);
    if (!result.ok) return { ok: false, error: result.error };
    const reservation = result.reservation;

    after(async () => {
      await notifyNewReservation(reservation);
      await retryPendingNotifications(5); // profite de l'occasion pour relancer d'éventuels échecs
    });

    return {
      ok: true,
      reference: reservation.reference,
      whatsappUrl: whatsappUrl(reservationWhatsAppText(reservation.locale, toEmailData(reservation))),
      ...summaryOf(data),
    };
  } catch (error) {
    console.error('[réservation] erreur inattendue :', error);
    return { ok: false, error: 'server' };
  }
}

function summaryOf(data: {
  email: string;
  firstName: string;
  lastName: string;
  date: string;
  time: string;
  guests: number;
}) {
  const service = serviceOf(data.date, data.time) ?? 'dinner';
  return {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    date: data.date,
    time: data.time,
    guests: data.guests,
    service,
  };
}
