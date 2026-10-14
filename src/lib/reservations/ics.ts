// Fichier agenda (.ics, RFC 5545) généré dans le navigateur : rien ne transite par le serveur.
import { restaurant } from '@/lib/restaurant';

export interface IcsEvent {
  reference: string;
  date: string;
  time: string;
  durationMinutes: number;
  title: string;
  description: string;
  location: string;
  url?: string;
}

/** Décalage de Yaoundé par rapport à UTC (UTC+1, pas d'heure d'été). */
const RESTAURANT_UTC_OFFSET_MINUTES = 60;

const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

function toUtcStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Coupe les lignes trop longues (75 octets max) comme l'exige la norme. */
function fold(line: string): string {
  const parts: string[] = [];
  let current = '';
  for (const char of line) {
    if (new TextEncoder().encode(current + char).length > 74) {
      parts.push(current);
      current = ' ';
    }
    current += char;
  }
  parts.push(current);
  return parts.join('\r\n');
}

export function buildIcs(event: IcsEvent, now: Date = new Date()): string {
  const [y, m, d] = event.date.split('-').map(Number) as [number, number, number];
  const [h, mi] = event.time.split(':').map(Number) as [number, number];
  const start = Date.UTC(y, m - 1, d, h, mi) - RESTAURANT_UTC_OFFSET_MINUTES * 60_000;
  const end = start + event.durationMinutes * 60_000;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Heritage//Reservations//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.reference}@heritage`,
    `DTSTAMP:${toUtcStamp(now.getTime())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    `GEO:${restaurant.geo.lat};${restaurant.geo.lng}`,
    ...(event.url ? [`URL:${event.url}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
