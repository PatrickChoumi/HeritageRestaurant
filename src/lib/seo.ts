// Métadonnées : balises canoniques, versions linguistiques (hreflang), OpenGraph et Schema.org.
import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';
import { routing, type AppLocale, type AppPathname } from '@/i18n/routing';
import { restaurant } from '@/lib/restaurant';

export function absoluteUrl(locale: AppLocale, href: AppPathname): string {
  const path = getPathname({ locale, href });
  return `${restaurant.siteUrl}${path === '/' ? '' : path}` || restaurant.siteUrl;
}

export function pageMetadata({
  locale,
  href,
  title,
  description,
}: {
  locale: AppLocale;
  href: AppPathname;
  title?: string;
  description: string;
}): Metadata {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, href)]));
  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: absoluteUrl(locale, href),
      languages: { ...languages, 'x-default': absoluteUrl(routing.defaultLocale, href) },
    },
    openGraph: {
      type: 'website',
      siteName: restaurant.name,
      locale: locale === 'fr' ? 'fr_FR' : 'en_GB',
      alternateLocale: locale === 'fr' ? ['en_GB'] : ['fr_FR'],
      url: absoluteUrl(locale, href),
      ...(title ? { title: `${title} · ${restaurant.name}` } : {}),
      description,
    },
    twitter: { card: 'summary_large_image', description, ...(title ? { title } : {}) },
  };
}

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function restaurantJsonLd(locale: AppLocale, description: string): Record<string, unknown> {
  const sameAs = Object.values(restaurant.social).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${restaurant.siteUrl}/#restaurant`,
    name: restaurant.name,
    description,
    url: absoluteUrl(locale, '/'),
    image: `${restaurant.siteUrl}${locale === routing.defaultLocale ? '' : `/${locale}`}/opengraph-image`,
    logo: `${restaurant.siteUrl}/icon.svg`,
    telephone: restaurant.phone.e164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address.street,
      addressLocality: restaurant.address.locality,
      addressRegion: restaurant.address.region,
      addressCountry: restaurant.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: restaurant.geo.lat, longitude: restaurant.geo.lng },
    servesCuisine:
      locale === 'fr' ? ['Camerounaise', 'Africaine', 'Gastronomique'] : ['Cameroonian', 'African', 'Fine dining'],
    priceRange: '5 000 – 25 000 FCFA',
    currenciesAccepted: restaurant.currency,
    acceptsReservations: absoluteUrl(locale, '/reservation'),
    hasMenu: absoluteUrl(locale, '/la-carte'),
    maximumAttendeeCapacity: restaurant.seats,
    openingHoursSpecification: restaurant.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${SCHEMA_DAYS[h.day]}`,
      opens: h.opens,
      closes: h.closes,
    })),
    ...(sameAs.length ? { sameAs } : {}),
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl(locale, '/reservation'),
        inLanguage: locale,
        actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
      },
      result: {
        '@type': 'FoodEstablishmentReservation',
        name: locale === 'fr' ? 'Réserver une table' : 'Book a table',
      },
    },
  };
}
