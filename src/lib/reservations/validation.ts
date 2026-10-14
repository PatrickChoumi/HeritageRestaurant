// Règles de saisie partagées entre le formulaire (confort) et le serveur (fait foi).
import { z } from 'zod';
import { restaurant } from '@/lib/restaurant';

export const OCCASIONS = ['birthday', 'business', 'romantic', 'celebration', 'other'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const REQUESTS_MAX = 500;

/** Retire les caractères de contrôle (sauts de ligne compris) et les espaces multiples. */
export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Comme cleanText mais garde les retours à la ligne (demandes particulières, messages). */
export function cleanMultiline(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Normalise un numéro de téléphone en format international (+XXX…).
 * Un numéro camerounais à 9 chiffres (6… ou 2…) reçoit l'indicatif +237.
 */
export function normalizePhone(value: string): string | null {
  let n = value.replace(/[\s.\-()/]/g, '');
  if (n.startsWith('00')) n = `+${n.slice(2)}`;
  if (/^[26]\d{8}$/.test(n)) n = `+237${n}`;
  if (/^237[26]\d{8}$/.test(n)) n = `+${n}`;
  if (!/^\+[1-9]\d{7,14}$/.test(n)) return null;
  return n;
}

/** Affichage lisible : +237 6 59 85 56 17 pour le Cameroun, groupes de 2 sinon. */
export function formatPhone(e164: string): string {
  const cm = /^\+237([26])(\d{8})$/.exec(e164);
  if (cm) return `+237 ${cm[1]} ${cm[2]!.match(/.{2}/g)!.join(' ')}`;
  return e164;
}

const name = z
  .string()
  .transform(cleanText)
  .pipe(
    z
      .string()
      .min(1, 'required')
      .max(60, 'tooLong')
      .regex(/\p{L}/u, 'invalid'),
  );

export const reservationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'invalid'),
  guests: z.coerce
    .number('invalid')
    .int('invalid')
    .min(1, 'invalid')
    .max(restaurant.reservation.maxGuestsOnline, 'groupTooLarge'),
  firstName: name,
  lastName: name,
  email: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.email('invalid').max(254, 'tooLong')),
  phone: z
    .string()
    .max(32, 'invalid')
    .transform((v, ctx) => {
      const phone = normalizePhone(v);
      if (!phone) {
        ctx.addIssue({ code: 'custom', message: v.trim() === '' ? 'required' : 'invalid' });
        return z.NEVER;
      }
      return phone;
    }),
  occasion: z.enum(OCCASIONS).optional().catch(undefined),
  requests: z
    .string()
    .optional()
    .transform((v) => (v ? cleanMultiline(v) : undefined))
    .pipe(z.string().max(REQUESTS_MAX, 'tooLong').optional()),
  consent: z.literal(true, 'required'),
  locale: z.enum(['fr', 'en']).catch('fr'),
});

export type ReservationInput = z.input<typeof reservationSchema>;
export type ReservationData = z.output<typeof reservationSchema>;

export type FieldErrors = Partial<Record<keyof ReservationData, string>>;

/** Premier code d'erreur par champ, prêt à être traduit côté navigateur. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!errors[key]) errors[key] = /^[a-zA-Z]+$/.test(issue.message) ? issue.message : 'invalid';
  }
  return errors;
}

export const contactSchema = z.object({
  name: z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(2, 'required').max(80, 'tooLong')),
  email: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.email('invalid').max(254, 'tooLong')),
  phone: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || v.trim() === '') return undefined;
      const phone = normalizePhone(v);
      if (!phone) {
        ctx.addIssue({ code: 'custom', message: 'invalid' });
        return z.NEVER;
      }
      return phone;
    }),
  subject: z.enum(['info', 'group', 'event', 'press', 'other']).catch('info'),
  message: z
    .string()
    .transform(cleanMultiline)
    .pipe(z.string().min(10, 'tooShort').max(2000, 'tooLong')),
  locale: z.enum(['fr', 'en']).catch('fr'),
});

export type ContactData = z.output<typeof contactSchema>;
