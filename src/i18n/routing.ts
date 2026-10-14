import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  // Français sans préfixe (/la-carte), anglais sous /en (/en/menu)
  localePrefix: 'as-needed',
  // URL traduites : meilleures pour le référencement et pour les visiteurs
  pathnames: {
    '/': '/',
    '/la-carte': { fr: '/la-carte', en: '/menu' },
    '/le-restaurant': { fr: '/le-restaurant', en: '/the-restaurant' },
    '/reservation': { fr: '/reservation', en: '/book-a-table' },
    '/contact': '/contact',
    '/mentions-legales': { fr: '/mentions-legales', en: '/legal-notice' },
  },
});

export type AppLocale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
