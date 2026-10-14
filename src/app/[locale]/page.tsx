import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/home/Hero';
import { Spirit } from '@/components/home/Spirit';
import { Signatures } from '@/components/home/Signatures';
import { Ambiance } from '@/components/home/Ambiance';
import { BookingSection } from '@/components/booking/BookingSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { pageMetadata, restaurantJsonLd } from '@/lib/seo';
import type { AppLocale } from '@/i18n/routing';

// Page statique régénérée toutes les 5 minutes (et immédiatement après une modification de la carte)
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return pageMetadata({ locale, href: '/', description: t('description') });
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const locale = (await params).locale as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations('Meta');

  return (
    <>
      <Hero />
      <Spirit />
      <Signatures />
      <Ambiance />
      <BookingSection />
      <JsonLd data={restaurantJsonLd(locale, t('description'))} />
    </>
  );
}
