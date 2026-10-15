// Calendrier du restaurant : dates, créneaux et disponibilités.
// Fonctions pures (sans base de données) : utilisées par le serveur, qui fait foi,
// et par le navigateur pour l'affichage. Toutes les heures sont celles de Yaoundé.
import { restaurant, type DayOfWeek, type ServiceId } from '@/lib/restaurant';

const MINUTES_PER_DAY = 24 * 60;

export function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const m = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isoToUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

export function dayOfWeek(iso: string): DayOfWeek {
  return new Date(isoToUtcMs(iso)).getUTCDay() as DayOfWeek;
}

export function addDays(iso: string, days: number): string {
  return new Date(isoToUtcMs(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  return Math.round((isoToUtcMs(to) - isoToUtcMs(from)) / 86_400_000);
}

export interface RestaurantNow {
  /** Date du jour à Yaoundé (AAAA-MM-JJ). */
  date: string;
  /** Minutes écoulées depuis minuit, heure de Yaoundé. */
  minutes: number;
}

export function restaurantNow(at: Date = new Date()): RestaurantNow {
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat('en-CA', {
    timeZone: restaurant.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(at)
    .forEach((p) => {
      parts[p.type] = p.value;
    });
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Minutes séparant « maintenant » d'un créneau donné (négatif s'il est passé). */
export function minutesUntil(date: string, time: string, now: RestaurantNow): number {
  return diffDays(now.date, date) * MINUTES_PER_DAY + toMinutes(time) - now.minutes;
}

export interface DayServices {
  id: ServiceId;
  slots: string[];
}

/** Services et créneaux proposés pour une date (vide si le restaurant est fermé). */
export function servicesFor(date: string): DayServices[] {
  const { reservation } = restaurant;
  if (reservation.closedDates.includes(date)) return [];
  const overrides = reservation.overrides[dayOfWeek(date)] ?? {};
  return reservation.services.map((service) => {
    const window = { ...service, ...overrides[service.id] };
    const slots: string[] = [];
    for (let t = toMinutes(window.firstSeating); t <= toMinutes(window.lastSeating); t += reservation.slotMinutes) {
      slots.push(fromMinutes(t));
    }
    return { id: service.id, slots };
  });
}

export function serviceOf(date: string, time: string): ServiceId | undefined {
  return servicesFor(date).find((s) => s.slots.includes(time))?.id;
}

export type BookingError =
  'dateInvalid' | 'datePast' | 'dateTooFar' | 'closed' | 'slotInvalid' | 'tooSoon' | 'guestsInvalid' | 'groupTooLarge';

/** Règles de réservation indépendantes de la base (la capacité est vérifiée à part). */
export function checkBookable(
  date: string,
  time: string,
  guests: number,
  now: RestaurantNow = restaurantNow(),
): BookingError | null {
  const { reservation } = restaurant;
  if (!Number.isInteger(guests) || guests < 1) return 'guestsInvalid';
  if (guests > reservation.maxGuestsOnline) return 'groupTooLarge';
  if (!isIsoDate(date)) return 'dateInvalid';
  if (date < now.date) return 'datePast';
  if (diffDays(now.date, date) > reservation.maxDaysAhead) return 'dateTooFar';
  const services = servicesFor(date);
  if (services.length === 0) return 'closed';
  if (!isTime(time) || !services.some((s) => s.slots.includes(time))) return 'slotInvalid';
  if (minutesUntil(date, time, now) < reservation.minLeadMinutes) return 'tooSoon';
  return null;
}

export type SlotStatus = 'available' | 'limited' | 'full' | 'past';

export interface SlotAvailability {
  time: string;
  remaining: number;
  status: SlotStatus;
}

export interface Availability {
  date: string;
  guests: number;
  closed: boolean;
  services: { id: ServiceId; slots: SlotAvailability[] }[];
}

export interface BookedCovers {
  bySlot: Record<string, number>;
  byService: Partial<Record<ServiceId, number>>;
}

/** Sous ce nombre de places restantes, le créneau est signalé « bientôt complet ». */
export const LIMITED_THRESHOLD = 6;

export function remainingFor(service: ServiceId, time: string, booked: BookedCovers): number {
  const { capacityPerSlot, capacityPerService } = restaurant.reservation;
  return Math.max(
    0,
    Math.min(capacityPerSlot - (booked.bySlot[time] ?? 0), capacityPerService - (booked.byService[service] ?? 0)),
  );
}

export function computeAvailability(
  date: string,
  guests: number,
  booked: BookedCovers,
  now: RestaurantNow = restaurantNow(),
): Availability {
  const services = servicesFor(date);
  return {
    date,
    guests,
    closed: services.length === 0,
    services: services.map((service) => ({
      id: service.id,
      slots: service.slots.map((time) => {
        const remaining = remainingFor(service.id, time, booked);
        let status: SlotStatus = 'available';
        if (checkBookable(date, time, guests, now) !== null) status = 'past';
        else if (remaining < guests) status = 'full';
        else if (remaining - guests < LIMITED_THRESHOLD) status = 'limited';
        return { time, remaining, status };
      }),
    })),
  };
}

export interface OpenStatus {
  open: boolean;
  /** Heure de fermeture (si ouvert) ou prochaine ouverture (si fermé). */
  until?: string;
  nextDay?: DayOfWeek;
}

/** « Ouvert maintenant » : tient compte des services qui finissent après minuit. */
export function openStatus(now: RestaurantNow = restaurantNow()): OpenStatus {
  const today = dayOfWeek(now.date);
  for (const offset of [0, -1]) {
    const day = ((today + offset + 7) % 7) as DayOfWeek;
    const hours = restaurant.openingHours.find((h) => h.day === day);
    if (!hours) continue;
    const opens = toMinutes(hours.opens) + offset * MINUTES_PER_DAY;
    let closes = toMinutes(hours.closes) + offset * MINUTES_PER_DAY;
    if (closes <= opens) closes += MINUTES_PER_DAY;
    if (now.minutes >= opens && now.minutes < closes) return { open: true, until: hours.closes };
  }
  for (let offset = 0; offset < 7; offset += 1) {
    const day = ((today + offset) % 7) as DayOfWeek;
    const hours = restaurant.openingHours.find((h) => h.day === day);
    if (!hours) continue;
    if (offset > 0 || toMinutes(hours.opens) > now.minutes) {
      return { open: false, until: hours.opens, nextDay: offset === 0 ? undefined : day };
    }
  }
  return { open: false };
}
