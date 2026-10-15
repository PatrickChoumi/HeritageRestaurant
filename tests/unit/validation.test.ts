import { describe, expect, it } from 'vitest';
import {
  cleanMultiline,
  cleanText,
  contactSchema,
  fieldErrors,
  formatPhone,
  normalizePhone,
  reservationSchema,
} from '@/lib/reservations/validation';

const valid = {
  date: '2026-10-20',
  time: '20:00',
  guests: '4',
  firstName: 'Aïcha',
  lastName: 'Mbarga',
  email: 'Aicha@Example.com',
  phone: '6 59 85 56 17',
  consent: true,
  locale: 'fr',
};

describe('téléphone', () => {
  it.each([
    ['659855617', '+237659855617'],
    ['6 59 85 56 17', '+237659855617'],
    ['+237 6 59 85 56 17', '+237659855617'],
    ['00237 659-855-617', '+237659855617'],
    ['237659855617', '+237659855617'],
    ['222 22 22 22', '+237222222222'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['+44 7700 900123', '+447700900123'],
  ])('normalise %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['12', '+0123456789', 'abc', '+2376598556170000000'])('refuse %s', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  it('affiche les numéros camerounais par groupes', () => {
    expect(formatPhone('+237659855617')).toBe('+237 6 59 85 56 17');
  });
});

describe('formulaire de réservation', () => {
  it('nettoie et normalise une saisie correcte', () => {
    const result = reservationSchema.safeParse({
      ...valid,
      firstName: '  Aïcha\n\u0007 ',
      requests: 'Table\r\n\r\n\r\ncalme   svp',
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      guests: 4,
      firstName: 'Aïcha',
      email: 'aicha@example.com',
      phone: '+237659855617',
      requests: 'Table\n\ncalme svp',
    });
  });

  it('renvoie un code d’erreur par champ', () => {
    const result = reservationSchema.safeParse({
      ...valid,
      email: 'pas-un-email',
      phone: '',
      firstName: '123',
      guests: 40,
      consent: false,
    });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toMatchObject({
      email: 'invalid',
      phone: 'required',
      firstName: 'invalid',
      guests: 'groupTooLarge',
      consent: 'required',
    });
  });

  it('retire les retours à la ligne des noms (pas d’injection d’en-têtes e-mail)', () => {
    expect(cleanText('Jean\r\nBcc: pirate@example.com')).toBe('Jean Bcc: pirate@example.com');
    expect(cleanMultiline('a b')).toBe('a b');
  });

  it('ignore une occasion inconnue et une langue inconnue', () => {
    const result = reservationSchema.safeParse({ ...valid, occasion: 'hack', locale: 'de' });
    expect(result.success && result.data.occasion).toBeUndefined();
    expect(result.success && result.data.locale).toBe('fr');
  });

  it('limite la longueur des demandes particulières', () => {
    expect(reservationSchema.safeParse({ ...valid, requests: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('formulaire de contact', () => {
  it('accepte un message sans téléphone', () => {
    const r = contactSchema.safeParse({
      name: 'Paul',
      email: 'p@example.com',
      message: 'Bonjour, une question sur les groupes.',
      locale: 'en',
    });
    expect(r.success).toBe(true);
    expect(r.data?.phone).toBeUndefined();
  });

  it('refuse un message trop court', () => {
    const r = contactSchema.safeParse({ name: 'Paul', email: 'p@example.com', message: 'Salut' });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!).message).toBe('tooShort');
  });
});
