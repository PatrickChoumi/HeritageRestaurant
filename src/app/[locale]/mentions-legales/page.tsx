import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { rich } from '@/components/ui/rich';
import { restaurant } from '@/lib/restaurant';
import { formatDateLong } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import type { AppLocale } from '@/i18n/routing';

const UPDATED = '2026-10-14';

export async function generateMetadata({ params }: PageProps<'/[locale]/mentions-legales'>): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'Legal' });
  return {
    ...pageMetadata({ locale, href: '/mentions-legales', title: t('metaTitle'), description: t('privacyIntro') }),
    robots: { index: false },
  };
}

export default async function LegalPage({ params }: PageProps<'/[locale]/mentions-legales'>) {
  const locale = (await params).locale as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations('Legal');
  const phone = restaurant.phone.display;

  const sections: { title: string; paragraphs: string[] }[] = [
    { title: t('publisherTitle'), paragraphs: [t('publisher', { phone })] },
    { title: t('hostingTitle'), paragraphs: [t('hosting')] },
    {
      title: t('privacyTitle'),
      paragraphs: [
        t('privacyIntro'),
        t('privacyUse'),
        t('privacyRetention'),
        t('privacyRights', { phone }),
        t('privacyProviders'),
      ],
    },
    { title: t('cookiesTitle'), paragraphs: [t('cookies')] },
    { title: t('creditsTitle'), paragraphs: [t('credits')] },
  ];

  return (
    <article className="container-luxe max-w-3xl pt-40 pb-28">
      <h1 className="title-lg">{t.rich('title', rich)}</h1>
      <p className="mt-4 text-sm text-mist">{t('updated', { date: formatDateLong(locale, UPDATED, true) })}</p>
      <div className="hairline my-12" />
      <div className="space-y-12">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="title-md">{s.title}</h2>
            <div className="mt-4 space-y-4">
              {s.paragraphs.map((p) => (
                <p key={p} className="leading-relaxed text-mist">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
