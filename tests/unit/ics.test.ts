import { describe, expect, it } from 'vitest';
import { buildIcs } from '@/lib/reservations/ics';

const ics = buildIcs(
  {
    reference: 'HER-ABC234',
    date: '2026-10-17',
    time: '20:00',
    durationMinutes: 120,
    title: 'Dîner chez Héritage',
    description: 'Réservation HER-ABC234, 4 convives; table calme\nmerci',
    location: 'Héritage, Quartier Bastos, Yaoundé',
  },
  new Date('2026-10-14T12:00:00Z'),
);

describe('fichier agenda (.ics)', () => {
  it('convertit l’heure de Yaoundé en UTC', () => {
    expect(ics).toContain('DTSTART:20261017T190000Z');
    expect(ics).toContain('DTEND:20261017T210000Z');
  });

  it('échappe les caractères spéciaux et utilise des fins de ligne CRLF', () => {
    expect(ics).toContain('4 convives\; table calme\\nmerci');
    expect(ics).toContain('Héritage\\, Quartier Bastos\\, Yaoundé');
    expect(ics.split('\r\n').length).toBeGreaterThan(10);
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('coupe les lignes à 75 octets maximum', () => {
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it('ajoute un rappel 2 heures avant', () => {
    expect(ics).toContain('TRIGGER:-PT2H');
  });
});
