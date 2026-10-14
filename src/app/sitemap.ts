import type { MetadataRoute } from 'next';
import { routing, type AppPathname } from '@/i18n/routing';
import { absoluteUrl } from '@/lib/seo';

const PAGES: {
  href: AppPathname;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}[] = [
  { href: '/', priority: 1, changeFrequency: 'weekly' },
  { href: '/la-carte', priority: 0.9, changeFrequency: 'weekly' },
  { href: '/reservation', priority: 0.9, changeFrequency: 'monthly' },
  { href: '/le-restaurant', priority: 0.7, changeFrequency: 'monthly' },
  { href: '/contact', priority: 0.6, changeFrequency: 'yearly' },
];

/** Plan du site bilingue, avec les versions linguistiques de chaque page (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, page.href),
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, page.href)])) },
    })),
  );
}
