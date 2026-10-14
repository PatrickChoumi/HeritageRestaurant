'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronDown, Printer, Sparkle } from '@/components/icons';
import { ALLERGENS, type Allergen } from '@/lib/menu-codes';
import { cn } from '@/lib/cn';

export interface BoardDish {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: string;
  allergens: Allergen[];
  tags: string[];
  isSignature: boolean;
  isAvailable: boolean;
}

export interface BoardCategory {
  slug: string;
  name: string;
  description: string;
  dishes: BoardDish[];
}

const EASE = [0.22, 1, 0.36, 1] as const;

function subscribeToHash(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

/** Carte interactive : onglets par catégorie (motif ARIA « tabs ») et filtre d'allergènes. */
export function MenuBoard({ categories }: { categories: BoardCategory[] }) {
  const t = useTranslations('Menu');
  const ta = useTranslations('Allergens');
  const tt = useTranslations('Tags');
  const uid = useId();
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const [avoid, setAvoid] = useState<Allergen[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Onglet initial depuis l'ancre (#plats) pour les liens partagés
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash.slice(1), () => '');
  const active =
    selected ?? (categories.some((c) => c.slug === hash) ? hash : (categories[0]?.slug ?? ''));

  const select = (slug: string, focus = false) => {
    setSelected(slug);
    window.history.replaceState(null, '', `#${slug}`);
    if (focus) tabRefs.current[slug]?.focus();
  };

  const onTabKey = (event: React.KeyboardEvent, index: number) => {
    const last = categories.length - 1;
    const target =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    select(categories[target]!.slug, true);
  };

  const visible = useMemo(() => {
    const result: Record<string, BoardDish[]> = {};
    for (const c of categories) result[c.slug] = c.dishes.filter((d) => !d.allergens.some((a) => avoid.includes(a)));
    return result;
  }, [categories, avoid]);

  const toggle = (a: Allergen) => setAvoid((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]));
  const hiddenTotal = categories.reduce((n, c) => n + c.dishes.length - (visible[c.slug]?.length ?? 0), 0);

  return (
    <div>
      {/* Barre d'onglets collante */}
      <div className="sticky top-[4.5rem] z-30 -mx-[clamp(1rem,4vw,3rem)] border-b border-gold/15 bg-ink/90 px-[clamp(1rem,4vw,3rem)] backdrop-blur-xl no-print">
        <div className="flex items-center justify-between gap-4">
          <div role="tablist" aria-label={t('tabs')} className="no-scrollbar -mb-px flex gap-6 overflow-x-auto md:gap-10">
            {categories.map((c, i) => (
              <button
                key={c.slug}
                ref={(el) => {
                  tabRefs.current[c.slug] = el;
                }}
                id={`${uid}-tab-${c.slug}`}
                role="tab"
                type="button"
                aria-selected={active === c.slug}
                aria-controls={`${uid}-panel-${c.slug}`}
                tabIndex={active === c.slug ? 0 : -1}
                onClick={() => select(c.slug)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  'relative shrink-0 cursor-pointer py-5 font-display text-xl whitespace-nowrap transition-colors duration-300 md:text-2xl',
                  active === c.slug ? 'text-gold' : 'text-ivory/65 hover:text-ivory',
                )}
              >
                {c.name}
                {active === c.slug && (
                  <motion.span layoutId={`${uid}-tab-line`} className="absolute inset-x-0 bottom-0 h-px bg-gold" transition={{ duration: 0.5, ease: EASE }} />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls={`${uid}-filters`}
            className="hidden shrink-0 cursor-pointer items-center gap-2 text-[0.68rem] tracking-[0.2em] text-ivory/80 uppercase hover:text-gold sm:flex"
          >
            {t('filterTitle')}
            {avoid.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-gold text-[0.6rem] text-ink">{avoid.length}</span>}
            <ChevronDown size={16} className={cn('transition-transform duration-300', filtersOpen && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Filtre d'allergènes */}
      <div className="mt-6 sm:hidden no-print">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls={`${uid}-filters`}
          className="flex w-full cursor-pointer items-center justify-between border border-ivory/15 px-4 py-3 text-[0.68rem] tracking-[0.2em] text-ivory/80 uppercase"
        >
          <span className="flex items-center gap-2">
            {t('filterTitle')}
            {avoid.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-gold text-[0.6rem] text-ink">{avoid.length}</span>}
          </span>
          <ChevronDown size={16} className={cn('transition-transform duration-300', filtersOpen && 'rotate-180')} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            id={`${uid}-filters`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden no-print"
          >
            <fieldset className="mt-6 border border-gold/15 bg-graphite/60 p-5 md:p-6">
              <legend className="sr-only">{t('filterTitle')}</legend>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-mist">{t('filterHint')}</p>
                {avoid.length > 0 && (
                  <button type="button" onClick={() => setAvoid([])} className="link-gold cursor-pointer text-xs tracking-[0.18em] uppercase">
                    {t('filterClear')}
                  </button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ALLERGENS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={avoid.includes(a)}
                    onClick={() => toggle(a)}
                    className={cn(
                      'min-h-10 cursor-pointer border px-3.5 text-xs transition-colors duration-300',
                      avoid.includes(a)
                        ? 'border-danger/70 bg-danger/15 text-ivory line-through decoration-danger/80'
                        : 'border-ivory/15 text-ivory/80 hover:border-gold/60',
                    )}
                  >
                    {ta(a)}
                  </button>
                ))}
              </div>
            </fieldset>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="mt-4 min-h-5 text-xs text-gold no-print" aria-live="polite">
        {hiddenTotal > 0 ? t('hidden', { count: hiddenTotal }) : ''}
      </p>

      {/* Panneaux : tous présents dans la page (référencement, impression), un seul affiché */}
      {categories.map((c) => {
        const dishes = visible[c.slug] ?? [];
        const isActive = active === c.slug;
        return (
          <section
            key={c.slug}
            id={`${uid}-panel-${c.slug}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${c.slug}`}
            hidden={!isActive}
            tabIndex={0}
            className="pt-8 focus-visible:outline-none print:pt-6"
          >
            <h2 className="print-only hidden font-display text-3xl">{c.name}</h2>
            <motion.div
              key={`${c.slug}-${isActive}`}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              {c.description && <p className="max-w-2xl font-display text-xl text-ivory/80 italic md:text-2xl">{c.description}</p>}
              {dishes.length === 0 ? (
                <p className="mt-10 text-sm text-mist">{t('empty')}</p>
              ) : (
                <ul className="mt-10 grid gap-x-16 gap-y-2 lg:grid-cols-2">
                  {dishes.map((dish, i) => (
                    <motion.li
                      key={dish.id}
                      initial={reduce ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: Math.min(i, 8) * 0.05, ease: EASE }}
                      className={cn('group border-b border-ivory/[0.08] py-6', !dish.isAvailable && 'opacity-60')}
                    >
                      <article>
                        <div className="flex items-baseline gap-3">
                          <h3 className="font-display text-2xl leading-tight text-ivory transition-colors duration-500 group-hover:text-gold">
                            {dish.name}
                          </h3>
                          <span className="mb-1.5 min-w-6 flex-1 border-b border-dotted border-ivory/25" aria-hidden="true" />
                          <p className="shrink-0 font-display text-xl text-gold tabular-nums">{dish.price}</p>
                        </div>
                        {dish.description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">{dish.description}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {dish.isSignature && (
                            <span className="chip border-gold/50 text-gold">
                              <Sparkle size={12} /> {t('signature')}
                            </span>
                          )}
                          {!dish.isAvailable && <span className="chip border-danger/50 text-ivory">{t('soldOut')}</span>}
                          {dish.tags.map((tag) => (
                            <span key={tag} className="chip">
                              {tt(tag as 'vegan')}
                            </span>
                          ))}
                          <span className="text-[0.7rem] text-mist">
                            {dish.allergens.length > 0 ? (
                              <>
                                <span className="sr-only">{t('allergens')} : </span>
                                <span aria-hidden="true">· </span>
                                {dish.allergens.map((a) => ta(a)).join(', ')}
                              </>
                            ) : (
                              <>
                                <span aria-hidden="true">· </span>
                                {t('noAllergen')}
                              </>
                            )}
                          </span>
                        </div>
                      </article>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          </section>
        );
      })}

      <div className="mt-16 flex flex-col gap-6 border-t border-gold/15 pt-10 md:flex-row md:items-center md:justify-between">
        <p className="max-w-xl text-xs leading-relaxed text-mist">{t('priceNote')}</p>
        <div className="flex flex-wrap gap-3 no-print">
          <button type="button" onClick={() => window.print()} className="btn btn-ghost min-h-11 px-5 py-2.5">
            <Printer size={16} /> {t('print')}
          </button>
          <Link href="/reservation" className="btn btn-gold min-h-11 px-5 py-2.5">
            {t('bookCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
