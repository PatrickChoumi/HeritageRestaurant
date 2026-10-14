// Modèles d'e-mails (HTML compatible messageries + version texte). Toute donnée saisie par
// un visiteur est échappée ; les sujets ne contiennent jamais de texte libre du client.
import { translator } from '@/i18n/messages';
import type { AppLocale } from '@/i18n/routing';
import { formatDateLong, formatTime } from '@/lib/format';
import { formatPhone } from '@/lib/reservations/validation';
import { googleMapsUrl, restaurant, whatsappUrl } from '@/lib/restaurant';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface ReservationEmailData {
  reference: string;
  date: string;
  time: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occasion?: string | null;
  requests?: string | null;
  locale: AppLocale;
  service: 'lunch' | 'dinner';
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const nl2br = (value: string) => escapeHtml(value).replace(/\n/g, '<br>');

const GOLD = '#D4AF37';
const INK = '#0D0D0D';
const CARD = '#151515';
const IVORY = '#F5F5F5';
const MIST = '#A0A0A0';

function layout({
  preheader,
  title,
  body,
  footer,
  lang = 'fr',
}: {
  preheader: string;
  title: string;
  body: string;
  footer: string;
  lang?: AppLocale;
}) {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td align="center" style="padding:0 0 28px;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:10px;color:${GOLD};">HÉRITAGE</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:4px;color:${MIST};padding-top:8px;">BASTOS · YAOUNDÉ</div>
</td></tr>
<tr><td style="background:${CARD};border:1px solid #2a2618;padding:40px 36px;">
<h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.25;color:${IVORY};">${escapeHtml(title)}</h1>
${body}
</td></tr>
<tr><td align="center" style="padding:28px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MIST};">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const p = (html: string) =>
  `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${IVORY};">${html}</p>`;

const muted = (html: string) =>
  `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${MIST};">${html}</p>`;

function details(rows: [string, string][]) {
  const cells = rows
    .map(
      ([label, value]) => `<tr>
<td style="padding:12px 0;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MIST};vertical-align:top;width:38%;">${escapeHtml(label)}</td>
<td style="padding:12px 0;border-bottom:1px solid #2a2a2a;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${IVORY};">${value}</td>
</tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;border-top:1px solid ${GOLD};">${cells}</table>`;
}

function button(href: string, label: string, filled = true) {
  const style = filled
    ? `background:${GOLD};color:${INK};border:1px solid ${GOLD};`
    : `background:transparent;color:${GOLD};border:1px solid ${GOLD};`;
  return `<a href="${escapeHtml(href)}" style="${style}display:inline-block;padding:14px 26px;margin:0 8px 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">${escapeHtml(label)}</a>`;
}

function reservationRows(locale: AppLocale, r: ReservationEmailData, withContact: boolean): [string, string][] {
  const t = translator(locale, 'Emails');
  const booking = translator(locale, 'Booking');
  const rows: [string, string][] = [
    [t('labels.reference'), `<strong style="color:${GOLD};letter-spacing:1px;">${escapeHtml(r.reference)}</strong>`],
    [t('labels.date'), escapeHtml(capitalize(formatDateLong(locale, r.date, true)))],
    [t('labels.time'), escapeHtml(formatTime(locale, r.time))],
    [t('labels.guests'), escapeHtml(t('guestsValue', { count: r.guests }))],
    [t('labels.name'), escapeHtml(`${r.firstName} ${r.lastName}`)],
  ];
  if (withContact) rows.push([t('labels.phone'), escapeHtml(formatPhone(r.phone))]);
  if (r.occasion) rows.push([t('labels.occasion'), escapeHtml(booking(`occasions.${r.occasion}` as 'occasions.other'))]);
  if (r.requests) rows.push([t('labels.requests'), nl2br(r.requests)]);
  return rows;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const stripHtml = (html: string) =>
  html
    .replace(/<br>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

export function reservationWhatsAppText(locale: AppLocale, r: ReservationEmailData): string {
  const t = translator(locale, 'Booking');
  return t('whatsappMessage', {
    reference: r.reference,
    date: formatDateLong(locale, r.date),
    time: formatTime(locale, r.time),
    guests: r.guests,
    name: `${r.firstName} ${r.lastName}`,
  });
}

/** E-mail au client : demande reçue, réservation confirmée ou annulée. */
export function clientReservationEmail(kind: 'received' | 'confirmed' | 'cancelled', r: ReservationEmailData): EmailContent {
  const locale = r.locale;
  const t = translator(locale, 'Emails');
  const date = formatDateLong(locale, r.date);
  const time = formatTime(locale, r.time);
  const vars = { date, time, reference: r.reference, guests: r.guests };
  const title = t(`${kind}.title`);
  const whatsapp = whatsappUrl(reservationWhatsAppText(locale, r));
  const sep = locale === 'fr' ? '\u00A0: ' : ': ';

  const body = [
    p(escapeHtml(t('greeting', { name: r.firstName }))),
    p(escapeHtml(t(`${kind}.intro`))),
    details(reservationRows(locale, r, false)),
    muted(escapeHtml(t(`${kind}.note`))),
    kind === 'cancelled'
      ? button(whatsappUrl(), t('whatsappCta'))
      : `${button(whatsapp, t('whatsappCta'))}${button(googleMapsUrl(), t('directions'), false)}`,
    `<div style="height:16px"></div>`,
    kind === 'cancelled' ? '' : muted(escapeHtml(t('change', { phone: restaurant.phone.display }))),
    p(`${escapeHtml(t('signature'))}<br><span style="color:${GOLD};font-family:Georgia,serif;font-size:17px;">${escapeHtml(t('team'))}</span>`),
  ].join('');

  const text = [
    t('greeting', { name: r.firstName }),
    '',
    t(`${kind}.intro`),
    '',
    ...reservationRows(locale, r, false).map(([label, value]) => `${label}${sep}${stripHtml(value)}`),
    '',
    t(`${kind}.note`),
    '',
    `${t('whatsappCta')}${sep}${kind === 'cancelled' ? whatsappUrl() : whatsapp}`,
    `${t('directions')}${sep}${googleMapsUrl()}`,
    '',
    kind === 'cancelled' ? '' : t('change', { phone: restaurant.phone.display }),
    '',
    t('signature'),
    t('team'),
  ].join('\n');

  return {
    subject: t(`${kind}.subject`, vars),
    html: layout({
      preheader: t(`${kind}.preheader`, vars),
      title,
      body,
      footer: escapeHtml(t('footer', { phone: restaurant.phone.display })),
      lang: locale,
    }),
    text,
  };
}

/** Alerte à l'établissement (en français : langue de l'équipe). */
export function restaurantReservationEmail(r: ReservationEmailData & { id: number }): EmailContent {
  const date = formatDateLong('fr', r.date);
  const time = formatTime('fr', r.time);
  const adminUrl = `${restaurant.siteUrl}/admin/reservations?id=${r.id}`;
  const clientWhatsapp = whatsappUrl(
    `Bonjour ${r.firstName}, ici Héritage. Nous confirmons votre réservation ${r.reference} du ${date} à ${time} pour ${r.guests} personne${r.guests > 1 ? 's' : ''}. À très vite !`,
    r.phone.replace(/\D/g, ''),
  );
  const rows = reservationRows('fr', r, true);
  rows.push(['E-mail', `<a href="mailto:${escapeHtml(r.email)}" style="color:${GOLD};">${escapeHtml(r.email)}</a>`]);
  rows.push(['Langue', r.locale === 'fr' ? 'Français' : 'Anglais']);

  const body = [
    p(`Nouvelle demande de réservation pour le <strong>${escapeHtml(date)} à ${escapeHtml(time)}</strong> (${r.service === 'lunch' ? 'déjeuner' : 'dîner'}).`),
    details(rows),
    `${button(adminUrl, 'Ouvrir dans l’administration')}${button(clientWhatsapp, 'Confirmer au client (WhatsApp)', false)}${button(`tel:${r.phone}`, 'Appeler', false)}`,
  ].join('');

  return {
    subject: `Nouvelle réservation ${r.reference} — ${date} ${time} — ${r.guests} couvert${r.guests > 1 ? 's' : ''}`,
    html: layout({
      preheader: `${r.firstName} ${r.lastName} · ${r.guests} pers. · ${date} ${time}`,
      title: 'Nouvelle réservation',
      body,
      footer: 'Message automatique du site Héritage.',
    }),
    text: [
      `Nouvelle réservation ${r.reference}`,
      `${date} à ${time} (${r.service === 'lunch' ? 'déjeuner' : 'dîner'}) — ${r.guests} couvert(s)`,
      `Client : ${r.firstName} ${r.lastName}`,
      `Téléphone : ${formatPhone(r.phone)}`,
      `E-mail : ${r.email}`,
      r.occasion ? `Occasion : ${r.occasion}` : '',
      r.requests ? `Demandes : ${r.requests}` : '',
      '',
      `Administration : ${adminUrl}`,
      `WhatsApp client : ${clientWhatsapp}`,
    ]
      .filter((line) => line !== '')
      .join('\n'),
  };
}

export interface ContactEmailData {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  locale: AppLocale;
}

export function restaurantContactEmail(m: ContactEmailData): EmailContent {
  const subjects = translator('fr', 'Contact');
  const subjectLabel = subjects(`form.subjects.${m.subject}` as 'form.subjects.info');
  const rows: [string, string][] = [
    ['Objet', escapeHtml(subjectLabel)],
    ['Nom', escapeHtml(m.name)],
    ['E-mail', `<a href="mailto:${escapeHtml(m.email)}" style="color:${GOLD};">${escapeHtml(m.email)}</a>`],
  ];
  if (m.phone) rows.push(['Téléphone', escapeHtml(formatPhone(m.phone))]);
  rows.push(['Message', nl2br(m.message)]);
  return {
    subject: `Nouveau message (${subjectLabel}) — site Héritage`,
    html: layout({
      preheader: `Message de ${m.name}`,
      title: 'Nouveau message',
      body: `${details(rows)}${button(`${restaurant.siteUrl}/admin/messages`, 'Voir dans l’administration')}`,
      footer: 'Message automatique du site Héritage. Répondez directement à cet e-mail pour écrire au client.',
    }),
    text: [`Nouveau message (${subjectLabel})`, `De : ${m.name} <${m.email}>`, m.phone ? `Téléphone : ${m.phone}` : '', '', m.message]
      .filter(Boolean)
      .join('\n'),
  };
}
