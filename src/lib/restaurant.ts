// Informations du restaurant : SOURCE UNIQUE pour le footer, la page contact,
// les microdonnées Schema.org, les e-mails et le calcul des créneaux de réservation.
// Aucun secret ici : ce fichier est aussi utilisé côté navigateur.

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = dimanche … 6 = samedi

export type ServiceId = 'lunch' | 'dinner';

export interface ServiceWindow {
  id: ServiceId;
  /** Premier créneau proposé (HH:MM). */
  firstSeating: string;
  /** Dernier créneau proposé (HH:MM). */
  lastSeating: string;
}

// Les variables NEXT_PUBLIC_* doivent être lues littéralement pour être intégrées au code navigateur.
const env = (value: string | undefined) => (value && value.trim() !== '' ? value.trim() : undefined);

export const restaurant = {
  name: 'Héritage',
  tagline: 'Bastos · Yaoundé',
  /** URL publique du site (balises canoniques, OpenGraph, sitemap, e-mails). */
  siteUrl: (env(process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000').replace(/\/$/, ''),
  timezone: 'Africa/Douala',
  currency: 'XAF',

  address: {
    street: 'Quartier Bastos',
    locality: 'Yaoundé',
    region: 'Centre',
    country: 'CM',
    countryName: { fr: 'Cameroun', en: 'Cameroon' },
  },
  // Position approximative du quartier Bastos : à affiner avec l'adresse exacte.
  geo: { lat: 3.895, lng: 11.5125 },

  phone: {
    e164: '+237659855617',
    display: '+237 6 59 85 56 17',
  },
  /** Numéro WhatsApp officiel, format international sans « + ». */
  whatsapp: (env(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) ?? '237659855617').replace(/\D/g, ''),
  /** Adresse e-mail affichée publiquement (facultative). */
  publicEmail: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL),

  /** Réseaux sociaux : affichés uniquement s'ils sont renseignés. */
  social: {
    instagram: env(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
    facebook: env(process.env.NEXT_PUBLIC_FACEBOOK_URL),
    tiktok: env(process.env.NEXT_PUBLIC_TIKTOK_URL),
  },

  /** Horaires d'ouverture. Une fermeture <= ouverture signifie « après minuit ». */
  openingHours: [
    { day: 1, opens: '11:00', closes: '23:00' },
    { day: 2, opens: '11:00', closes: '23:00' },
    { day: 3, opens: '11:00', closes: '23:00' },
    { day: 4, opens: '11:00', closes: '23:00' },
    { day: 5, opens: '11:00', closes: '02:00' },
    { day: 6, opens: '11:00', closes: '00:00' },
    { day: 0, opens: '11:00', closes: '22:00' },
  ] as { day: DayOfWeek; opens: string; closes: string }[],

  /** Le vendredi soir, soirée karaoké jusqu'à 2 h. */
  karaokeDay: 5 as DayOfWeek,

  reservation: {
    /** Intervalle entre deux créneaux, en minutes. */
    slotMinutes: 30,
    /** Délai minimum entre maintenant et l'heure réservée, en minutes. */
    minLeadMinutes: 60,
    /** On réserve au plus N jours à l'avance. */
    maxDaysAhead: 60,
    /** Au-delà, la réservation se fait par WhatsApp ou téléphone (groupes, privatisation). */
    maxGuestsOnline: 10,
    /** Nouveaux couverts acceptés par créneau (rythme de la cuisine). */
    capacityPerSlot: 24,
    /** Couverts maximum sur un service complet (taille de la salle). */
    capacityPerService: 64,
    /** Durée indicative d'un repas, pour l'ajout à l'agenda. */
    durationMinutes: 120,
    services: [
      { id: 'lunch', firstSeating: '12:00', lastSeating: '14:30' },
      { id: 'dinner', firstSeating: '19:00', lastSeating: '22:00' },
    ] as ServiceWindow[],
    /** Exceptions par jour de la semaine (le dernier créneau suit l'heure de fermeture). */
    overrides: {
      0: { dinner: { lastSeating: '21:00' } },
      5: { dinner: { lastSeating: '23:00' } },
      6: { dinner: { lastSeating: '22:30' } },
    } as Partial<Record<DayOfWeek, Partial<Record<ServiceId, Partial<ServiceWindow>>>>>,
    /** Dates de fermeture exceptionnelle (AAAA-MM-JJ). */
    closedDates: [] as string[],
  },

  seats: 64,
} as const;

export function whatsappUrl(text?: string, number: string = restaurant.whatsapp): string {
  const base = `https://wa.me/${number.replace(/\D/g, '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function googleMapsUrl(): string {
  const q = encodeURIComponent(`${restaurant.name}, ${restaurant.address.street}, ${restaurant.address.locality}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function googleMapsEmbedUrl(locale: string): string {
  const { lat, lng } = restaurant.geo;
  return `https://www.google.com/maps?q=${lat},${lng}&z=15&hl=${locale}&output=embed`;
}
