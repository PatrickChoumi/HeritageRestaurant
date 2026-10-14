import { describe, expect, it } from 'vitest';
import {
  addDays,
  checkBookable,
  computeAvailability,
  dayOfWeek,
  isIsoDate,
  openStatus,
  restaurantNow,
  servicesFor,
  type RestaurantNow,
} from '@/lib/reservations/time';
import { restaurant } from '@/lib/restaurant';

// Mercredi 14 octobre 2026, 10h00 à Yaoundé
const NOW: RestaurantNow = { date: '2026-10-14', minutes: 10 * 60 };

describe('calendrier', () => {
  it('reconnaît les dates valides', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-2-3')).toBe(false);
    expect(isIsoDate(42)).toBe(false);
  });

  it('calcule les jours de la semaine et les décalages', () => {
    expect(dayOfWeek('2026-10-16')).toBe(5); // vendredi
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('donne l’heure de Yaoundé (UTC+1)', () => {
    expect(restaurantNow(new Date('2026-10-14T23:30:00Z'))).toEqual({ date: '2026-10-15', minutes: 30 });
  });
});

describe('créneaux', () => {
  it('propose déjeuner et dîner, avec un dîner plus long le vendredi et plus court le dimanche', () => {
    const wednesday = servicesFor('2026-10-14');
    expect(wednesday.map((s) => s.id)).toEqual(['lunch', 'dinner']);
    expect(wednesday[0]!.slots).toEqual(['12:00', '12:30', '13:00', '13:30', '14:00', '14:30']);
    expect(wednesday[1]!.slots.at(-1)).toBe('22:00');
    expect(servicesFor('2026-10-16')[1]!.slots.at(-1)).toBe('23:00'); // vendredi karaoké
    expect(servicesFor('2026-10-18')[1]!.slots.at(-1)).toBe('21:00'); // dimanche
  });

  it('refuse les demandes hors règles', () => {
    expect(checkBookable('2026-10-14', '20:00', 2, NOW)).toBeNull();
    expect(checkBookable('2026-10-13', '20:00', 2, NOW)).toBe('datePast');
    expect(checkBookable(addDays(NOW.date, restaurant.reservation.maxDaysAhead + 1), '20:00', 2, NOW)).toBe('dateTooFar');
    expect(checkBookable('2026-10-14', '20:15', 2, NOW)).toBe('slotInvalid');
    expect(checkBookable('2026-10-14', '16:00', 2, NOW)).toBe('slotInvalid');
    expect(checkBookable('2026-10-14', '20:00', 0, NOW)).toBe('guestsInvalid');
    expect(checkBookable('2026-10-14', '20:00', restaurant.reservation.maxGuestsOnline + 1, NOW)).toBe('groupTooLarge');
    expect(checkBookable('not-a-date', '20:00', 2, NOW)).toBe('dateInvalid');
  });

  it('impose un délai minimum avant le créneau', () => {
    const late = { date: '2026-10-14', minutes: 19 * 60 + 30 };
    expect(checkBookable('2026-10-14', '20:00', 2, late)).toBe('tooSoon');
    expect(checkBookable('2026-10-14', '20:30', 2, late)).toBeNull();
  });
});

describe('disponibilités', () => {
  const { capacityPerSlot, capacityPerService } = restaurant.reservation;

  it('marque les créneaux complets, presque complets et passés', () => {
    const availability = computeAvailability(
      '2026-10-14',
      4,
      { bySlot: { '20:00': capacityPerSlot - 2, '20:30': capacityPerSlot - 8 }, byService: { dinner: 0 } },
      { date: '2026-10-14', minutes: 13 * 60 },
    );
    const dinner = availability.services.find((s) => s.id === 'dinner')!;
    const lunch = availability.services.find((s) => s.id === 'lunch')!;
    expect(dinner.slots.find((s) => s.time === '20:00')).toMatchObject({ status: 'full', remaining: 2 });
    expect(dinner.slots.find((s) => s.time === '20:30')).toMatchObject({ status: 'limited', remaining: 8 });
    expect(dinner.slots.find((s) => s.time === '21:00')).toMatchObject({ status: 'available' });
    expect(lunch.slots.find((s) => s.time === '12:00')!.status).toBe('past');
  });

  it('applique aussi la capacité de la salle sur tout le service', () => {
    const availability = computeAvailability('2026-10-20', 2, { bySlot: {}, byService: { dinner: capacityPerService - 1 } }, NOW);
    expect(availability.services.find((s) => s.id === 'dinner')!.slots.every((s) => s.status === 'full')).toBe(true);
    expect(availability.services.find((s) => s.id === 'lunch')!.slots.every((s) => s.status === 'available')).toBe(true);
  });
});

describe('ouvert maintenant', () => {
  it('est ouvert en journée et indique l’heure de fermeture', () => {
    expect(openStatus({ date: '2026-10-14', minutes: 15 * 60 })).toEqual({ open: true, until: '23:00' });
  });

  it('tient compte du service du vendredi qui finit après minuit', () => {
    // Samedi 17 octobre à 1h30 : encore dans la soirée karaoké du vendredi
    expect(openStatus({ date: '2026-10-17', minutes: 90 })).toEqual({ open: true, until: '02:00' });
    // Samedi à 3h : fermé, ouvre à 11h
    expect(openStatus({ date: '2026-10-17', minutes: 180 })).toEqual({ open: false, until: '11:00', nextDay: undefined });
  });

  it('annonce la réouverture du lendemain après la fermeture', () => {
    expect(openStatus({ date: '2026-10-18', minutes: 22 * 60 + 30 })).toEqual({ open: false, until: '11:00', nextDay: 1 });
  });
});
