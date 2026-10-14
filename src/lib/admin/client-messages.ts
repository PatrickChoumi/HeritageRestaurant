// Messages WhatsApp pré-remplis que l'équipe envoie au client (dans la langue du client).
import { formatDateLong, formatTime } from '@/lib/format';
import { whatsappUrl } from '@/lib/restaurant';

export interface ClientContact {
  firstName: string;
  phone: string;
  reference: string;
  date: string;
  time: string;
  guests: number;
  locale: 'fr' | 'en';
}

export function clientWhatsappUrl(r: ClientContact, kind: 'confirm' | 'cancel' | 'contact' = 'confirm'): string {
  const date = formatDateLong(r.locale, r.date);
  const time = formatTime(r.locale, r.time);
  const fr = {
    confirm: `Bonjour ${r.firstName}, ici Héritage. Nous confirmons votre réservation ${r.reference} du ${date} à ${time} pour ${r.guests} personne${r.guests > 1 ? 's' : ''}. À très vite !`,
    cancel: `Bonjour ${r.firstName}, ici Héritage. Nous sommes désolés : nous ne pouvons pas honorer votre réservation ${r.reference} du ${date} à ${time}. Pouvons-nous vous proposer un autre horaire ?`,
    contact: `Bonjour ${r.firstName}, ici Héritage, au sujet de votre réservation ${r.reference} du ${date} à ${time}.`,
  };
  const en = {
    confirm: `Hello ${r.firstName}, this is Héritage. We confirm your booking ${r.reference} on ${date} at ${time} for ${r.guests} guest${r.guests > 1 ? 's' : ''}. See you soon!`,
    cancel: `Hello ${r.firstName}, this is Héritage. We are sorry: we cannot honour your booking ${r.reference} on ${date} at ${time}. May we suggest another time?`,
    contact: `Hello ${r.firstName}, this is Héritage, regarding your booking ${r.reference} on ${date} at ${time}.`,
  };
  return whatsappUrl((r.locale === 'en' ? en : fr)[kind], r.phone.replace(/\D/g, ''));
}
