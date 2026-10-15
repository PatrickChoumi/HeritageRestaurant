'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from '@/components/icons';
import { Reveal } from '@/components/ui/Reveal';
import { imageFor } from '@/lib/images';
import { cn } from '@/lib/cn';

export interface SignatureCard {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
  available: boolean;
}

/** Carrousel horizontal (défilement natif aimanté, flèches, glisser à la souris). */
export function SignatureCarousel({ dishes }: { dishes: SignatureCard[] }) {
  const t = useTranslations('Signatures');
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('li');
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 400) + 24), behavior: 'smooth' });
  };

  return (
    <div className="relative mt-16">
      <ul
        ref={track}
        tabIndex={0}
        aria-label={t('kicker')}
        onScroll={update}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || !track.current) return;
          drag.current = { x: e.clientX, left: track.current.scrollLeft };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!drag.current || !track.current) return;
          track.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={() => {
          drag.current = null;
          setDragging(false);
        }}
        onPointerLeave={() => {
          drag.current = null;
          setDragging(false);
        }}
        className={cn(
          'no-scrollbar flex gap-6 overflow-x-auto px-[max(1rem,calc((100vw-88rem)/2+3rem))] pb-4 select-none focus-visible:outline-offset-[-2px] md:cursor-grab',
          dragging ? 'snap-none md:cursor-grabbing' : 'snap-x snap-mandatory',
        )}
      >
        {dishes.map((dish, i) => {
          const image = imageFor(dish.image);
          return (
            <Reveal
              as="li"
              key={dish.id}
              delay={Math.min(i, 3) * 0.1}
              className="group w-[78vw] max-w-[26rem] shrink-0 snap-start sm:w-[24rem]"
            >
              <article>
                <div className="img-frame aspect-[4/5]">
                  {image && (
                    <Image
                      src={image}
                      alt={dish.name}
                      fill
                      sizes="(min-width: 640px) 26rem, 78vw"
                      placeholder="blur"
                      draggable={false}
                      className={cn(
                        'object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]',
                        !dish.available && 'grayscale',
                      )}
                    />
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent"
                    aria-hidden="true"
                  />
                  <span className="absolute top-5 left-5 font-display text-sm text-gold tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {!dish.available && (
                    <span className="absolute top-5 right-5 bg-ink/80 px-3 py-1 text-[0.65rem] tracking-[0.2em] text-ivory uppercase">
                      {t('soldOut')}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="flex items-end justify-between gap-4">
                      <h3 className="font-display text-[1.65rem] leading-tight">{dish.name}</h3>
                      <p className="shrink-0 pb-1 text-sm text-gold tabular-nums">{dish.price}</p>
                    </div>
                    <div
                      className="mt-3 h-px w-12 bg-gold transition-all duration-700 group-hover:w-full"
                      aria-hidden="true"
                    />
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ivory/75">{dish.description}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </ul>

      <div className="container-luxe mt-10 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={edges.start}
          aria-label={t('prev')}
          className="grid size-12 cursor-pointer place-items-center border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-ink disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={edges.end}
          aria-label={t('next')}
          className="grid size-12 cursor-pointer place-items-center border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-ink disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
