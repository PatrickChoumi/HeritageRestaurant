'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { openStatus, restaurantNow, type OpenStatus as Status } from '@/lib/reservations/time';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';

/** « Ouvert · ferme à 23h00 », calculé à l'heure de Yaoundé et rafraîchi chaque minute. */
export function OpenStatus({ className }: { className?: string }) {
  const t = useTranslations('Footer');
  const days = useTranslations('DaysLower');
  const locale = useLocale();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const update = () => setStatus(openStatus(restaurantNow()));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!status?.until) return <span className={cn('inline-block h-5', className)} aria-hidden="true" />;

  const time = formatTime(locale, status.until);
  const label = status.open
    ? t('openNow', { time })
    : status.nextDay !== undefined
      ? t('closedUntil', { time, day: days(String(status.nextDay) as '0') })
      : t('closedNow', { time });

  return (
    <span role="status" className={cn('inline-flex items-center gap-2.5 text-xs tracking-wide', className)}>
      <span className="relative flex size-2" aria-hidden="true">
        {status.open && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', status.open ? 'bg-success' : 'bg-danger')} />
      </span>
      {label}
    </span>
  );
}
