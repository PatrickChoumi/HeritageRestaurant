'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { Logo } from '@/components/brand/Logo';
import { Close, Phone, WhatsApp } from '@/components/icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NAV_ITEMS } from './nav-items';
import { restaurant, whatsappUrl } from '@/lib/restaurant';
import { cn } from '@/lib/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

export function SiteHeader() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  // Menu mobile : fermé à chaque changement de page (ajustement pendant le rendu, sans effet)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  // Échap pour fermer, défilement de la page bloqué pendant l'ouverture
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,height,border-color,backdrop-filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          scrolled || open
            ? 'h-[4.5rem] border-b border-gold/15 bg-ink/85 backdrop-blur-xl'
            : 'h-24 border-b border-transparent bg-gradient-to-b from-ink/75 to-transparent',
        )}
      >
        <div className="container-luxe flex h-full items-center justify-between gap-6">
          <Link href="/" aria-label={t('homeLabel')} className="relative z-10 shrink-0">
            <Logo compact={scrolled} />
          </Link>

          <nav aria-label={t('primary')} className="hidden lg:block">
            <ul className="flex items-center gap-1 xl:gap-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'group relative block px-3 py-2 text-[0.74rem] tracking-[0.2em] uppercase transition-colors duration-300',
                      isActive(item.href) ? 'text-gold' : 'text-ivory/80 hover:text-ivory',
                    )}
                  >
                    {t(item.key)}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-3 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        isActive(item.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                      )}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher className="hidden sm:flex" />
            <Link href="/reservation" className="btn btn-outline hidden min-h-11 px-5 py-2.5 md:inline-flex">
              {t('book')}
            </Link>
            <button
              ref={burgerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t('closeMenu') : t('openMenu')}
              className="relative z-10 -mr-2 grid size-11 cursor-pointer place-items-center lg:hidden"
            >
              <span className="relative block h-3 w-7" aria-hidden="true">
                <span
                  className={cn(
                    'absolute left-0 h-px w-7 bg-gold transition-transform duration-500',
                    open ? 'top-1.5 rotate-45' : 'top-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute right-0 h-px bg-gold transition-all duration-500',
                    open ? 'top-1.5 w-7 -rotate-45' : 'top-3 w-4',
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Progression de lecture */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX: progress }}
          className={cn(
            'absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-opacity duration-500',
            scrolled ? 'opacity-100' : 'opacity-0',
          )}
        />
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t('primary')}
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ink pt-24 lg:hidden"
          >
            <nav aria-label={t('primary')} className="container-luxe flex-1 py-8">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: EASE }}
                  >
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className="group flex items-baseline gap-5 border-b border-ivory/10 py-4"
                    >
                      <span className="font-sans text-xs text-gold/70 tabular-nums">0{i + 1}</span>
                      <span
                        className={cn(
                          'font-display text-4xl font-light transition-colors sm:text-5xl',
                          isActive(item.href) ? 'text-gold italic' : 'text-ivory group-hover:text-gold',
                        )}
                      >
                        {t(item.key)}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="container-luxe space-y-6 pb-10"
            >
              <Link href="/reservation" className="btn btn-gold w-full">
                {t('book')}
              </Link>
              <div className="flex items-center justify-between gap-4">
                <LanguageSwitcher />
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${restaurant.phone.e164}`}
                    className="grid size-11 place-items-center border border-ivory/15 text-ivory/80"
                    aria-label={restaurant.phone.display}
                  >
                    <Phone size={18} />
                  </a>
                  <a
                    href={whatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-11 place-items-center border border-ivory/15 text-ivory/80"
                    aria-label="WhatsApp"
                  >
                    <WhatsApp size={18} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid size-11 cursor-pointer place-items-center border border-gold/40 text-gold"
                    aria-label={t('closeMenu')}
                  >
                    <Close size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
