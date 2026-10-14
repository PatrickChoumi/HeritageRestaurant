import { describe, expect, it } from 'vitest';
import { generateReference, REFERENCE_PATTERN } from '@/lib/reservations/reference';
import { formatDateLong, formatPrice, formatTime } from '@/lib/format';
import { whatsappUrl } from '@/lib/restaurant';

describe('références de réservation', () => {
  it('sont lisibles (sans 0, O, 1, I, L) et uniques', () => {
    const refs = new Set(Array.from({ length: 2000 }, generateReference));
    expect(refs.size).toBe(2000);
    for (const ref of refs) expect(ref).toMatch(REFERENCE_PATTERN);
  });
});

describe('formats', () => {
  it('affiche les prix en francs CFA', () => {
    expect(formatPrice('fr', 14000)).toBe('14 000 FCFA');
    expect(formatPrice('en', 14000)).toBe('14,000 FCFA');
  });

  it('affiche les heures à la française et à l’anglaise', () => {
    expect(formatTime('fr', '20:30')).toBe('20h30');
    expect(formatTime('en', '20:30')).toBe('8:30 pm');
    expect(formatTime('fr', '00:00')).toBe('minuit');
  });

  it('affiche les dates complètes', () => {
    expect(formatDateLong('fr', '2026-10-17')).toBe('samedi 17 octobre');
    expect(formatDateLong('en', '2026-10-17')).toBe('Saturday 17 October');
    expect(formatDateLong('en', '2026-10-17', true)).toBe('Saturday, 17 October 2026');
  });
});

describe('WhatsApp', () => {
  it('encode le message pré-rempli (aucun paramètre ne peut être injecté)', () => {
    const url = whatsappUrl('Bonjour & merci ?text=pirate');
    expect(url).toBe('https://wa.me/237659855617?text=Bonjour%20%26%20merci%20%3Ftext%3Dpirate');
  });
});
