'use client';

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowDown, Pause, Play } from '@/components/icons';
import { rich } from '@/components/ui/rich';
import { images } from '@/lib/images';
import { cn } from '@/lib/cn';

const SLIDES = [
  { key: 'salle', image: images['hero/salle'] },
  { key: 'braise', image: images['hero/braise'] },
  { key: 'chef', image: images['hero/chef'] },
] as const;

const DURATION = 7000;
const EASE = [0.22, 1, 0.36, 1] as const;
// Le texte apparaît juste après le rideau d'ouverture (ou tout de suite s'il a déjà été vu)
const INTRO = 'intro-in';

export function Hero() {
  const t = useTranslations('Hero');
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  const running = !paused && !hovered && !reduce;
  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(next, DURATION);
    return () => window.clearTimeout(id);
  }, [running, index, next]);

  const slide = SLIDES[index]!;

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label={t('kicker')}
      className="relative h-[100svh] min-h-[38rem] overflow-hidden bg-ink"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photos superposées en fondu enchaîné, lent zoom (Ken Burns) et parallaxe au défilement */}
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y: imageY }}>
        {SLIDES.map((s, i) => (
          <motion.div
            key={s.key}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
            aria-hidden={i !== index}
          >
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={i === index && !reduce ? { scale: [1.14, 1] } : { scale: 1.06 }}
              transition={{ duration: i === index ? DURATION / 1000 + 2 : 1.6, ease: 'linear' }}
            >
              <Image
                src={s.image}
                alt={i === index ? t(`slides.${s.key}.alt`) : ''}
                fill
                sizes="100vw"
                placeholder="blur"
                preload={i === 0}
                fetchPriority={i === 0 ? undefined : 'low'}
                quality={80}
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Voiles sombres pour la lisibilité */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(13_13_13/0.2),rgb(13_13_13/0.82))]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-ink" aria-hidden="true" />

      <motion.div
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-4 pt-16 text-center"
      >
        <p className={cn('kicker justify-center [--d:0.1s]', INTRO)}>{t('kicker')}</p>
        <div
          className={cn(
            'mt-8 grid min-h-[8.5rem] place-items-center [--d:0.2s] sm:min-h-[10rem] md:min-h-[12rem]',
            INTRO,
          )}
          aria-live={running ? 'off' : 'polite'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={slide.key}
              className="title-xl text-shadow-soft mx-auto max-w-5xl"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              {t.rich(`slides.${slide.key}.title`, rich)}
            </motion.h1>
          </AnimatePresence>
        </div>
        <p className={cn('lead mx-auto mt-4 max-w-xl text-ivory/85 [--d:0.35s]', INTRO)}>{t('lead')}</p>
        <div
          className={cn(
            'mt-10 flex w-full flex-col items-center justify-center gap-4 [--d:0.5s] sm:w-auto sm:flex-row',
            INTRO,
          )}
        >
          <Link href="/reservation" className="btn btn-gold w-full sm:w-auto sm:min-w-60">
            {t('ctaBook')}
          </Link>
          <Link href="/la-carte" className="btn btn-ghost w-full sm:w-auto sm:min-w-60">
            {t('ctaMenu')}
          </Link>
        </div>
      </motion.div>

      {/* Indicateurs et contrôle du diaporama */}
      <div className="container-luxe absolute inset-x-0 bottom-6 z-10 flex items-end justify-between md:bottom-8">
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t('goTo', { index: i + 1 })}
              aria-current={i === index}
              className="relative h-11 w-10 cursor-pointer md:w-14"
            >
              <span className="absolute inset-x-1 top-1/2 h-px bg-ivory/25" />
              <span
                key={i === index ? `${index}-${running}` : 'idle'}
                className={cn(
                  'absolute inset-x-1 top-1/2 h-px origin-left bg-gold',
                  i === index ? 'scale-x-100' : 'scale-x-0',
                  i === index && running && 'animate-[progress_7s_linear_both]',
                )}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? t('play') : t('pause')}
            className="grid size-11 cursor-pointer place-items-center text-ivory/70 hover:text-gold"
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
        <a
          href="#esprit"
          className="hidden flex-col items-center gap-3 text-[0.65rem] tracking-[0.3em] text-ivory/70 uppercase transition-colors hover:text-gold md:flex"
        >
          {t('scroll')}
          <ArrowDown size={18} className="animate-bounce motion-reduce:animate-none" />
        </a>
        <p className="font-display text-sm text-ivory/70 tabular-nums" aria-hidden="true">
          <span className="text-gold">0{index + 1}</span> / 0{SLIDES.length}
        </p>
      </div>
    </section>
  );
}
