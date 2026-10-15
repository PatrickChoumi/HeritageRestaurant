import type { MetadataRoute } from 'next';
import { restaurant } from '@/lib/restaurant';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${restaurant.siteUrl}/sitemap.xml`,
    host: restaurant.siteUrl,
  };
}
