// Notifications d'une réservation : e-mail au client, alerte à l'établissement,
// et (si Twilio est configuré) message WhatsApp automatique au restaurant.
// Un échec n'annule jamais la réservation : il est noté et retenté plus tard.
import 'server-only';
import { and, eq, gt, isNull, lt, or, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { reservations } from '@/lib/db/schema';
import { restaurantInbox, sendEmail } from '@/lib/email/send';
import {
  clientReservationEmail,
  restaurantReservationEmail,
  type ReservationEmailData,
} from '@/lib/email/templates';
import { formatDateLong, formatTime } from '@/lib/format';
import { formatPhone } from './validation';
import type { Reservation } from './service';

export const MAX_EMAIL_ATTEMPTS = 5;

export function toEmailData(r: Reservation): ReservationEmailData & { id: number } {
  return {
    id: r.id,
    reference: r.reference,
    date: r.date,
    time: r.time,
    guests: r.guests,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    occasion: r.occasion,
    requests: r.requests,
    locale: r.locale,
    service: r.service,
  };
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 500);

/** Envoie ce qui n'est pas encore parti pour cette réservation. */
export async function notifyNewReservation(r: Reservation): Promise<void> {
  const db = await getDb();
  const data = toEmailData(r);
  const errors: string[] = [];
  const update: Partial<typeof reservations.$inferInsert> = {};

  if (!r.clientEmailSentAt) {
    try {
      await sendEmail({ to: r.email, replyTo: restaurantInbox(), ...clientReservationEmail(r.status === 'confirmed' ? 'confirmed' : 'received', data) });
      update.clientEmailSentAt = new Date();
    } catch (e) {
      errors.push(`client: ${errorMessage(e)}`);
    }
  }
  if (!r.restaurantEmailSentAt) {
    try {
      await sendEmail({ to: restaurantInbox(), replyTo: r.email, ...restaurantReservationEmail(data) });
      update.restaurantEmailSentAt = new Date();
    } catch (e) {
      errors.push(`restaurant: ${errorMessage(e)}`);
    }
  }
  if (!r.whatsappNotifiedAt && twilioConfigured()) {
    try {
      await sendWhatsAppAlert(r);
      update.whatsappNotifiedAt = new Date();
    } catch (e) {
      errors.push(`whatsapp: ${errorMessage(e)}`);
    }
  }

  await db
    .update(reservations)
    .set({
      ...update,
      emailAttempts: sql`${reservations.emailAttempts} + 1`,
      lastEmailError: errors.length ? errors.join(' | ') : null,
    })
    .where(eq(reservations.id, r.id));
  if (errors.length) console.error(`[réservation ${r.reference}] notification incomplète :`, errors.join(' | '));
}

/** E-mail au client après une décision de l'équipe (confirmation ou annulation). */
export async function notifyStatusChange(r: Reservation, kind: 'confirmed' | 'cancelled'): Promise<void> {
  await sendEmail({ to: r.email, replyTo: restaurantInbox(), ...clientReservationEmail(kind, toEmailData(r)) });
}

/** Relance des notifications en échec des dernières 48 h (appelée par la tâche planifiée). */
export async function retryPendingNotifications(limit = 20): Promise<number> {
  const db = await getDb();
  const pending = await db
    .select()
    .from(reservations)
    .where(
      and(
        or(isNull(reservations.clientEmailSentAt), isNull(reservations.restaurantEmailSentAt)),
        lt(reservations.emailAttempts, MAX_EMAIL_ATTEMPTS),
        gt(reservations.createdAt, sql`now() - interval '48 hours'`),
      ),
    )
    .limit(limit);
  for (const r of pending) await notifyNewReservation(r);
  return pending.length;
}

/* ------------------------------------------------------ WhatsApp (Twilio) */

function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM &&
      process.env.TWILIO_WHATSAPP_TO,
  );
}

/**
 * Alerte WhatsApp envoyée automatiquement au restaurant via l'API Twilio.
 * Hors fenêtre de 24 h, WhatsApp impose un modèle approuvé : TWILIO_CONTENT_SID l'utilise.
 */
async function sendWhatsAppAlert(r: Reservation): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const body = new URLSearchParams({
    From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    To: `whatsapp:${process.env.TWILIO_WHATSAPP_TO}`,
  });
  const date = formatDateLong('fr', r.date);
  const time = formatTime('fr', r.time);
  if (process.env.TWILIO_CONTENT_SID) {
    body.set('ContentSid', process.env.TWILIO_CONTENT_SID);
    body.set(
      'ContentVariables',
      JSON.stringify({ 1: r.reference, 2: `${date} ${time}`, 3: String(r.guests), 4: `${r.firstName} ${r.lastName}` }),
    );
  } else {
    body.set(
      'Body',
      `Nouvelle réservation ${r.reference}\n${date} à ${time} — ${r.guests} couvert(s)\n${r.firstName} ${r.lastName} · ${formatPhone(r.phone)}`,
    );
  }
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Twilio ${response.status}`);
}
