'use client';

import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Close, Music, Plus } from '@/components/icons';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { rich } from '@/components/ui/rich';
import { images, type ImageKey } from '@/lib/images';
import { restaurant } from '@/lib/restaurant';
import { cn } from '@/lib/cn';

type CaptionKey = 'salle' | 'panneaux' | 'table' | 'braise' | 'lumieres' | 'dressage';

const GALLERY: { key: CaptionKey; image: ImageKey; className: string }[] = [
  { key: 'salle', image: 'hero/salle', className: 'col-span-2 row-span-2' },
  { key: 'panneaux', image: 'ambiance/panneaux', className: 'row-span-2' },
  { key: 'table', image: 'ambiance/table', className: 'row-span-2 md:order-4' },
  { key: 'braise', image: 'hero/braise', className: 'col-span-2 row-span-2 md:order-5' },
  { key: 'lumieres', image: 'ambiance/lumieres', className: 'row-span-2 md:order-6' },
];

/** Cadre & Ambiance : grille photo + visionneuse plein écran accessible (clavier, glisser). */
export function Ambiance() {
  const t = useTranslations('Ambiance');
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen((current) => {
      if (current !== null) window.setTimeout(() => triggers.current[current]?.focus(), 0);
      return null;
    });
  }, []);
  const go = useCallback((dir: 1 | -1) => {
    setOpen((current) => (current === null ? null : (current + dir + GALLERY.length) % GALLERY.length));
  }, []);

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close, go]);

  const current = open === null ? null : GALLERY[open]!;

  return (
    <section className="relative py-28 md:py-36">
      <div className="container-luxe">
        <SectionHeading
          kicker={t('kicker')}
          title={t.rich('title', rich)}
          intro={t('intro', { seats: restaurant.seats })}
        />

        <ul className="mt-16 grid auto-rows-[9.5rem] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[12rem] md:grid-cols-4 md:gap-4 lg:auto-rows-[13.5rem]">
          {GALLERY.map((item, i) => (
            <Reveal as="li" key={item.key} delay={(i % 3) * 0.1} className={cn('relative', item.className)}>
              <button
                ref={(el) => {
                  triggers.current[i] = el;
                }}
                type="button"
                onClick={() => setOpen(i)}
                aria-label={t('open', { caption: t(`items.${item.key}`) })}
                className="group img-frame absolute inset-0 block size-full cursor-zoom-in"
              >
                <Image
                  src={images[item.image]}
                  alt=""
                  fill
                  sizes={item.className.includes('col-span-2') ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
                  placeholder="blur"
                  className="object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent opacity-70 transition-opacity duration-700 group-hover:opacity-100" />
                <span className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-3 text-left">
                  <span className="font-display text-lg text-ivory md:text-xl">{t(`items.${item.key}`)}</span>
                  <span className="grid size-9 shrink-0 scale-75 place-items-center rounded-full border border-gold/60 text-gold opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
                    <Plus size={16} />
                  </span>
                </span>
              </button>
            </Reveal>
          ))}

          {/* Tuile « vendredi karaoké » */}
          <Reveal as="li" delay={0.2} className="relative row-span-2 md:order-3">
            <div className="absolute inset-0 flex flex-col justify-between overflow-hidden border border-gold/25 bg-[radial-gradient(circle_at_30%_20%,rgb(212_175_55/0.18),transparent_60%)] p-5 md:p-7">
              <Music size={30} className="text-gold" />
              <div>
                <h3 className="font-display text-xl leading-tight md:text-2xl">{t('karaokeTitle')}</h3>
                <p className="mt-3 hidden text-sm leading-relaxed text-mist sm:block">{t('karaokeText')}</p>
              </div>
            </div>
          </Reveal>
        </ul>
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t(`items.${current.key}`)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <div className="container-luxe flex h-20 shrink-0 items-center justify-between">
              <p className="font-display text-sm text-ivory/70 tabular-nums">
                {t('counter', { current: (open ?? 0) + 1, total: GALLERY.length })}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label={t('close')}
                className="grid size-11 cursor-pointer place-items-center border border-gold/40 text-gold hover:bg-gold hover:text-ink"
              >
                <Close size={18} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1" onClick={(e) => e.target === e.currentTarget && close()}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.figure
                  key={current.key}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.4}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) go(1);
                    else if (info.offset.x > 80) go(-1);
                  }}
                  className="absolute inset-x-4 inset-y-0 flex flex-col items-center justify-center md:inset-x-24"
                >
                  <div className="relative size-full">
                    <Image
                      src={images[current.image]}
                      alt={t(`items.${current.key}`)}
                      fill
                      sizes="100vw"
                      placeholder="blur"
                      quality={90}
                      className="object-contain"
                      draggable={false}
                    />
                  </div>
                  <figcaption className="py-5 font-display text-xl text-ivory">{t(`items.${current.key}`)}</figcaption>
                </motion.figure>
              </AnimatePresence>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t('prev')}
                className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 cursor-pointer place-items-center border border-gold/40 bg-ink/60 text-gold hover:bg-gold hover:text-ink md:grid"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t('next')}
                className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 cursor-pointer place-items-center border border-gold/40 bg-ink/60 text-gold hover:bg-gold hover:text-ink md:grid"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
