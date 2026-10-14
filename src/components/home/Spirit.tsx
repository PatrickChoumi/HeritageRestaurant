import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Flame, Hands, Leaf } from '@/components/icons';
import { Parallax } from '@/components/ui/Parallax';
import { Reveal } from '@/components/ui/Reveal';
import { rich } from '@/components/ui/rich';
import { images } from '@/lib/images';

const PILLARS = [
  { key: 'produit', Icon: Leaf },
  { key: 'feu', Icon: Flame },
  { key: 'partage', Icon: Hands },
] as const;

/** « L'Esprit » : concept, histoire et vision du Chef, en mise en page asymétrique. */
export async function Spirit() {
  const t = await getTranslations('Spirit');

  return (
    <section id="esprit" className="relative overflow-hidden py-28 md:py-40">
      {/* Grand mot décoratif en filigrane */}
      {/* Mot décoratif en filigrane (pseudo-élément : ignoré par les lecteurs d'écran) */}
      <span
        aria-hidden="true"
        data-text="Héritage"
        className="pointer-events-none absolute -top-6 right-[-4vw] font-display text-[22vw] leading-none font-light text-ivory/[0.025] select-none before:content-[attr(data-text)]"
      />

      <div className="container-luxe grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
        {/* Images superposées */}
        <div className="relative lg:col-span-6">
          <Reveal className="gold-frame relative ml-6 md:ml-10">
            <Parallax className="aspect-[4/5] w-full" strength={8}>
              <Image
                src={images['hero/chef']}
                alt={t('imageAlt')}
                fill
                sizes="(min-width: 1024px) 45vw, 90vw"
                placeholder="blur"
                className="object-cover object-[60%_center]"
              />
            </Parallax>
          </Reveal>
          <Reveal
            delay={0.25}
            className="absolute -bottom-12 -left-2 w-[48%] border-8 border-ink shadow-2xl shadow-black/60 md:-left-6 lg:-bottom-16"
          >
            <div className="relative aspect-square">
              <Image
                src={images['plats/ndole']}
                alt={t('detailAlt')}
                fill
                sizes="(min-width: 1024px) 22vw, 45vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        {/* Texte */}
        <div className="lg:col-span-5 lg:col-start-8">
          <Reveal>
            <p className="kicker">{t('kicker')}</p>
            <h2 className="title-lg mt-6">{t.rich('title', rich)}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 font-display text-2xl leading-snug text-ivory md:text-[1.7rem]">{t('lead')}</p>
            <p className="lead mt-6">{t('body')}</p>
          </Reveal>

          <Reveal delay={0.15} as="figure" className="relative mt-10 border-l border-gold/50 pl-8">
            <span aria-hidden="true" className="absolute -top-6 left-5 font-display text-7xl leading-none text-gold/30">
              “
            </span>
            <blockquote className="font-display text-xl leading-relaxed text-ivory/90 italic md:text-2xl">
              {t('quote')}
            </blockquote>
            <figcaption className="mt-4 text-xs tracking-[0.3em] text-gold uppercase">— {t('quoteAuthor')}</figcaption>
          </Reveal>

          <Reveal delay={0.2}>
            <Link
              href="/le-restaurant"
              className="group mt-10 inline-flex items-center gap-4 text-xs tracking-[0.25em] text-gold uppercase"
            >
              <span className="link-gold">{t('cta')}</span>
              <ArrowRight size={18} className="transition-transform duration-500 group-hover:translate-x-1.5" />
            </Link>
          </Reveal>
        </div>
      </div>

      {/* Trois piliers */}
      <div className="container-luxe mt-32 md:mt-40">
        <ul className="grid gap-px overflow-hidden border border-gold/10 bg-gold/10 md:grid-cols-3">
          {PILLARS.map(({ key, Icon }, i) => (
            <Reveal
              as="li"
              key={key}
              delay={i * 0.12}
              className="group relative bg-ink p-10 transition-colors duration-700 hover:bg-graphite md:p-12"
            >
              <span className="font-display text-sm text-gold/70 tabular-nums">0{i + 1}</span>
              <Icon size={34} className="mt-6 text-gold transition-transform duration-700 group-hover:-translate-y-1" />
              <h3 className="title-md mt-6">{t(`pillars.${key}.title`)}</h3>
              <p className="mt-4 text-sm leading-relaxed text-mist">{t(`pillars.${key}.text`)}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
