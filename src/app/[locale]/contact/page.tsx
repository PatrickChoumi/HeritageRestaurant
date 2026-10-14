import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/contact/ContactForm';
import { Clock, Mail, MapPin, Phone, WhatsApp } from '@/components/icons';
import { MapEmbed } from '@/components/layout/MapEmbed';
import { OpenStatus } from '@/components/layout/OpenStatus';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { rich } from '@/components/ui/rich';
import { images } from '@/lib/images';
import { formatTime } from '@/lib/format';
import { googleMapsUrl, restaurant, whatsappUrl } from '@/lib/restaurant';
import { pageMetadata, restaurantJsonLd } from '@/lib/seo';
import type { AppLocale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return pageMetadata({ locale, href: '/contact', title: t('metaTitle'), description: t('metaDescription') });
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = (await params).locale as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');
  const days = await getTranslations('Days');
  const meta = await getTranslations('Meta');
  const footer = await getTranslations('Footer');

  const cards = [
    {
      Icon: MapPin,
      label: t('address'),
      value: `${restaurant.address.street}, ${restaurant.address.locality}`,
      href: googleMapsUrl(),
      action: footer('directions'),
      external: true,
    },
    {
      Icon: Phone,
      label: t('phone'),
      value: restaurant.phone.display,
      href: `tel:${restaurant.phone.e164}`,
      action: footer('call'),
    },
    {
      Icon: WhatsApp,
      label: t('whatsapp'),
      value: restaurant.phone.display,
      href: whatsappUrl(t('whatsappMessage')),
      action: t('whatsappCta'),
      external: true,
    },
    ...(restaurant.publicEmail
      ? [
          {
            Icon: Mail,
            label: t('email'),
            value: restaurant.publicEmail,
            href: `mailto:${restaurant.publicEmail}`,
            action: t('email'),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHero
        image={images['ambiance/lumieres']}
        alt=""
        kicker={t('kicker')}
        title={t.rich('title', rich)}
        intro={t('intro')}
      />

      <section className="container-luxe py-24 md:py-32">
        <ul className="grid gap-px border border-gold/10 bg-gold/10 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ Icon, label, value, href, action, external }, i) => (
            <Reveal as="li" key={label} delay={i * 0.08} className="bg-ink">
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group flex h-full flex-col gap-4 p-8 transition-colors duration-500 hover:bg-graphite md:p-10"
              >
                <Icon size={26} className="text-gold" />
                <span className="label">{label}</span>
                <span className="font-display text-2xl leading-snug break-words text-ivory">{value}</span>
                <span className="mt-auto pt-2 text-[0.68rem] tracking-[0.2em] text-gold uppercase transition-transform duration-500 group-hover:translate-x-1">
                  {action} →
                </span>
              </a>
            </Reveal>
          ))}
        </ul>

        <div className="mt-20 grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 className="title-md mb-10">{t('form.title')}</h2>
            <ContactForm />
          </Reveal>
          <Reveal delay={0.1} className="space-y-8 lg:col-span-5">
            <div className="border border-gold/15 p-8">
              <h2 className="flex items-center gap-3 font-display text-2xl">
                <Clock size={22} className="text-gold" /> {t('hours')}
              </h2>
              <OpenStatus className="mt-4 text-ivory/80" />
              <dl className="mt-6 divide-y divide-ivory/[0.07] text-sm">
                {restaurant.openingHours.map((h) => (
                  <div key={h.day} className="flex justify-between py-2.5">
                    <dt className="text-ivory/85">{days(String(h.day) as '0')}</dt>
                    <dd className="text-mist tabular-nums">
                      {formatTime(locale, h.opens)} – {formatTime(locale, h.closes)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <MapEmbed className="aspect-[4/3] w-full" />
          </Reveal>
        </div>
      </section>
      <JsonLd data={restaurantJsonLd(locale, meta('description'))} />
    </>
  );
}
