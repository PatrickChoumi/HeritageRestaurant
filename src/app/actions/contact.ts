'use server';

import { after } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { contactMessages } from '@/lib/db/schema';
import { clientFingerprint, rateLimit } from '@/lib/rate-limit';
import { contactSchema, fieldErrors } from '@/lib/reservations/validation';
import { restaurantInbox, sendEmail } from '@/lib/email/send';
import { restaurantContactEmail } from '@/lib/email/templates';

export type ContactResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string>; error?: 'rateLimited' | 'server' };

/** Formulaire de contact : message enregistré en base, puis transmis au restaurant par e-mail. */
export async function submitContact(input: unknown): Promise<ContactResult> {
  try {
    const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    if (typeof raw.website === 'string' && raw.website.trim() !== '') return { ok: true }; // robot

    const limit = await rateLimit(`contact:${await clientFingerprint()}`, 4, 30 * 60);
    if (!limit.allowed) return { ok: false, error: 'rateLimited' };

    const db = await getDb();
    const [message] = await db
      .insert(contactMessages)
      .values({ ...parsed.data, phone: parsed.data.phone ?? null })
      .returning();
    if (!message) return { ok: false, error: 'server' };

    after(async () => {
      try {
        await sendEmail({ to: restaurantInbox(), replyTo: message.email, ...restaurantContactEmail(message) });
        await db.update(contactMessages).set({ emailSentAt: new Date() }).where(eq(contactMessages.id, message.id));
      } catch (error) {
        console.error('[contact] e-mail non envoyé :', error);
      }
    });
    return { ok: true };
  } catch (error) {
    console.error('[contact] erreur inattendue :', error);
    return { ok: false, error: 'server' };
  }
}
