import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MenuBoard, type BoardCategory } from '@/components/menu/MenuBoard';
import { PageHero } from '@/components/ui/PageHero';
import { JsonLd } from '@/components/seo/JsonLd';
import { rich } from '@/components/ui/rich';
import { getMenu, type MenuCategory } from '@/lib/menu';
import { images } from '@/lib/images';
import { formatPrice } from '@/lib/format';
import { absoluteUrl, pageMetadata } from '@/lib/seo';
import { restaurant } from '@/lib/restaurant';
import type { AppLocale } from '@/i18n/routing';

// Carte lue en base, mise en cache 5 minutes et régénérée dès qu'elle est modifiée dans l'administration
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[locale]/la-carte'>): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'Menu' });
  return pageMetadata({ locale, href: '/la-carte', title: t('metaTitle'), description: t('metaDescription') });
}

const DIETS: Record<string, string> = {
  vegetarian: 'https://schema.org/VegetarianDiet',
  vegan: 'https://schema.org/VeganDiet',
};

function menuJsonLd(locale: AppLocale, name: string, categories: MenuCategory[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name,
    inLanguage: locale,
    url: absoluteUrl(locale, '/la-carte'),
    mainEntityOfPage: absoluteUrl(locale, '/la-carte'),
    provider: { '@id': `${restaurant.siteUrl}/#restaurant` },
    hasMenuSection: categories.map((c) => ({
      '@type': 'MenuSection',
      name: c.name,
      description: c.description || undefined,
      hasMenuItem: c.dishes.map((d) => ({
        '@type': 'MenuItem',
        name: d.name,
        description: d.description || undefined,
        offers: {
          '@type': 'Offer',
          price: d.price,
          priceCurrency: restaurant.currency,
          availability: d.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        ...(d.tags.some((tag) => DIETS[tag]) ? { suitableForDiet: d.tags.map((tag) => DIETS[tag]).filter(Boolean) } : {}),
      })),
    })),
  };
}

export default async function MenuPage({ params }: PageProps<'/[locale]/la-carte'>) {
  const locale = (await params).locale as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations('Menu');

  let categories: MenuCategory[] = [];
  let failed = false;
  try {
    categories = await getMenu(locale);
  } catch (error) {
    failed = true;
    console.error('[héritage] Lecture de la carte impossible :', error);
  }

  const board: BoardCategory[] = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    dishes: c.dishes.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      description: d.description,
      price: formatPrice(locale, d.price),
      allergens: d.allergens,
      tags: d.tags,
      isSignature: d.isSignature,
      isAvailable: d.isAvailable,
    })),
  }));

  return (
    <>
      <PageHero
        image={images['plats/bar-braise']}
        alt=""
        kicker={t('kicker')}
        title={t.rich('title', rich)}
        intro={t('intro')}
      />
      <section className="container-luxe pb-28">
        {failed ? <p className="py-20 text-center text-mist">{t('unavailable')}</p> : <MenuBoard categories={board} />}
      </section>
      {!failed && <JsonLd data={menuJsonLd(locale, t('metaTitle'), categories)} />}
    </>
  );
}
