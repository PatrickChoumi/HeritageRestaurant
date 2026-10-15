'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

/** Bascule FR / EN : même page, même position de défilement. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: AppLocale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next, scroll: false });
    });
  }

  return (
    <div
      role="group"
      aria-label={t('language')}
      className={cn('flex items-center text-[0.72rem] tracking-[0.2em]', className)}
    >
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="mx-2 h-3 w-px bg-ivory/25" aria-hidden="true" />}
          <button
            type="button"
            lang={l}
            onClick={() => switchTo(l)}
            aria-pressed={l === locale}
            aria-label={l === 'fr' ? 'Français' : 'English'}
            disabled={pending}
            className={cn(
              'cursor-pointer px-1 py-2 uppercase transition-colors duration-300',
              l === locale ? 'text-gold' : 'text-ivory/60 hover:text-ivory',
            )}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
