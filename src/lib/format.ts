// Formats d'affichage partagés (navigateur, serveur, e-mails).
type AppLocale = 'fr' | 'en';

const NBSP = '\u00A0';

export function formatPrice(locale: AppLocale, amount: number): string {
  return `${new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB').format(amount)}${NBSP}FCFA`;
}

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** « samedi 17 octobre » / « Saturday 17 October » (l'année est ajoutée si besoin). */
export function formatDateLong(locale: AppLocale, iso: string, withYear = false): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: withYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(isoToDate(iso));
}

export function formatDateShort(locale: AppLocale, iso: string): { weekday: string; day: string; month: string } {
  const date = isoToDate(iso);
  const tag = locale === 'fr' ? 'fr-FR' : 'en-GB';
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(tag, { ...options, timeZone: 'UTC' }).format(date).replace('.', '');
  return { weekday: part({ weekday: 'short' }), day: part({ day: 'numeric' }), month: part({ month: 'short' }) };
}

/** « 20h30 » en français, « 8:30 pm » en anglais. */
export function formatTime(locale: AppLocale, hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  if (h === 0 && m === 0) return locale === 'fr' ? 'minuit' : 'midnight';
  if (locale === 'fr') return `${h}h${String(m).padStart(2, '0')}`;
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${NBSP}${suffix}`;
}

/** Initiale + nom pour l'affichage discret (« M. Mbarga »). */
export function shortName(firstName: string, lastName: string): string {
  return `${firstName.charAt(0).toUpperCase()}. ${lastName}`;
}
