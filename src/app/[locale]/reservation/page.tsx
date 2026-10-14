import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BookingSection } from '@/components/booking/BookingSection';
import { pageMetadata } from '@/lib/seo';
import type { AppLocale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/reservation'>): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'Booking' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  return pageMetadata({ locale, href: '/reservation', title: nav('book'), description: t('intro') });
}

export default async function ReservationPage({ params }: PageProps<'/[locale]/reservation'>) {
  const locale = (await params).locale as AppLocale;
  setRequestLocale(locale);
  return (
    <div className="pt-16">
      <BookingSection headingLevel="h1" />
    </div>
  );
}
