import type { AppPathname } from '@/i18n/routing';

export const NAV_ITEMS: { href: AppPathname; key: 'home' | 'menu' | 'restaurant' | 'reservation' | 'contact' }[] = [
  { href: '/', key: 'home' },
  { href: '/la-carte', key: 'menu' },
  { href: '/le-restaurant', key: 'restaurant' },
  { href: '/reservation', key: 'reservation' },
  { href: '/contact', key: 'contact' },
];
