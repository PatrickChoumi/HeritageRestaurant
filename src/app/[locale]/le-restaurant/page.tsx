import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Door, Leaf, Music, Sparkle, Users, Wine } from '@/components/icons';
import { PageHero } from '@/components/ui/PageHero';
import { Parallax } from '@/components/ui/Parallax';
import { Reveal } from '@/components/ui/Reveal';
import { rich } from '@/components/ui/rich';
import { images } from '@/lib/images';
import { pageMetadata } from '@/lib/seo';
import { restaurant } from '@/lib/restaurant';
import type { AppLocale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/le-restaurant'>): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'Restaurant' });
  return pageMetadata({ locale, href: '/le-restaurant', title: t('metaTitle'), description: t('metaDescription') });
}

export default async function RestaurantPage({ params }: PageProps<'/[locale]/le-restaurant'>) {
  const locale = (await params).locale as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations('Restaurant');

  const facts = [
    { Icon: Users, title: t('place.seats', { count: restaurant.seats }), text: t('place.seatsText') },
    { Icon: Door, title: t('place.private'), text: t('place.privateText') },
    { Icon: Music, title: t('place.karaoke'), text: t('place.karaokeText') },
  ];
  const values = [
    { key: 'local', Icon: Leaf },
    { key: 'season', Icon: Sparkle },
    { key: 'welcome', Icon: Wine },
  ] as const;

  return (
    <>
      <PageHero
        image={images['hero/salle']}
        alt={t('imageAlt.salle')}
        kicker={t('kicker')}
        title={t.rich('title', rich)}
        intro={t('intro')}
      />

      {/* Histoire */}
      <section className="container-luxe grid gap-16 py-28 md:py-36 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="kicker">{t('story.kicker')}</p>
          <h2 className="title-lg mt-6">{t.rich('story.title', rich)}</h2>
        </Reveal>
        <div className="space-y-6 lg:col-span-6 lg:col-start-7">
          <Reveal delay={0.1}>
            <p className="font-display text-2xl leading-snug text-ivory first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-gold md:text-[1.7rem]">
              {t('story.p1')}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="lead">{t('story.p2')}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="lead text-ivory/90">{t('story.p3')}</p>
          </Reveal>
        </div>
      </section>

      {/* Bandeau parallaxe */}
      <Parallax className="h-[60svh] min-h-80" strength={14}>
        <Image
          src={images['hero/braise']}
          alt={t('imageAlt.braise')}
          fill
          sizes="100vw"
          placeholder="blur"
          className="object-cover"
        />
      </Parallax>

      {/* Vision du Chef */}
      <section className="relative overflow-hidden bg-coal py-28 md:py-36">
        <div className="container-luxe grid items-center gap-16 lg:grid-cols-12">
          <Reveal className="gold-frame relative ml-6 lg:col-span-5">
            <div className="relative aspect-[4/5]">
              <Image
                src={images['ambiance/dressage']}
                alt={t('imageAlt.chef')}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal>
              <p className="kicker">{t('chef.kicker')}</p>
              <h2 className="title-lg mt-6">{t.rich('chef.title', rich)}</h2>
            </Reveal>
            <Reveal delay={0.1} as="figure" className="mt-10 border-l border-gold/50 pl-8">
              <blockquote className="font-display text-2xl leading-relaxed text-ivory/95 italic md:text-[1.75rem]">
                “{t('chef.quote')}”
              </blockquote>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="lead mt-8">{t('chef.p1')}</p>
              <p className="lead mt-5">{t('chef.p2')}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Le lieu */}
      <section className="container-luxe py-28 md:py-36">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="kicker">{t('place.kicker')}</p>
            <h2 className="title-lg mt-6">{t('place.title')}</h2>
            <p className="lead mt-6">{t('place.text')}</p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <Reveal className="img-frame relative aspect-[4/5] sm:row-span-2 sm:aspect-auto">
              <Image
                src={images['ambiance/panneaux']}
                alt=""
                fill
                sizes="(min-width: 1024px) 28vw, 50vw"
                placeholder="blur"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={0.1} className="img-frame relative aspect-[4/3]">
              <Image
                src={images['ambiance/table']}
                alt=""
                fill
                sizes="(min-width: 1024px) 28vw, 50vw"
                placeholder="blur"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={0.2} className="img-frame relative aspect-[4/3]">
              <Image
                src={images['ambiance/lumieres']}
                alt=""
                fill
                sizes="(min-width: 1024px) 28vw, 50vw"
                placeholder="blur"
                className="object-cover"
              />
            </Reveal>
          </div>
        </div>
        <ul className="mt-16 grid gap-px border border-gold/10 bg-gold/10 md:grid-cols-3">
          {facts.map(({ Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 0.1} className="bg-ink p-8 md:p-10">
              <Icon size={28} className="text-gold" />
              <h3 className="title-md mt-5">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist">{text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Engagements */}
      <section className="border-t border-gold/10 bg-coal py-28 md:py-32">
        <div className="container-luxe">
          <Reveal className="text-center">
            <p className="kicker justify-center">{t('values.kicker')}</p>
          </Reveal>
          <ul className="mt-14 grid gap-12 md:grid-cols-3">
            {values.map(({ key, Icon }, i) => (
              <Reveal as="li" key={key} delay={i * 0.12} className="text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full border border-gold/40 text-gold">
                  <Icon size={26} />
                </span>
                <h3 className="title-md mt-6">{t(`values.${key}.title`)}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-mist">{t(`values.${key}.text`)}</p>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.2} className="mt-16 text-center">
            <Link href="/reservation" className="btn btn-gold">
              {t('cta')}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
