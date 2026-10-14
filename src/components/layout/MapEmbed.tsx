'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { MapPin } from '@/components/icons';
import { googleMapsEmbedUrl, googleMapsUrl } from '@/lib/restaurant';
import { cn } from '@/lib/cn';

/**
 * Carte Google Maps chargée seulement au clic : aucune requête vers Google avant,
 * page plus rapide, et respect de la vie privée. Teinte sombre assortie au site.
 */
export function MapEmbed({ className }: { className?: string }) {
  const t = useTranslations('Map');
  const locale = useLocale();
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative isolate overflow-hidden border border-gold/15 bg-graphite', className)}>
      {loaded ? (
        <iframe
          title={t('title')}
          src={googleMapsEmbedUrl(locale)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full [filter:invert(92%)_hue-rotate(180deg)_saturate(0.6)_brightness(0.9)_contrast(0.95)]"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          {/* Plan stylisé (purement décoratif) */}
          <svg aria-hidden="true" className="absolute inset-0 -z-10 size-full opacity-40" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 240">
            <g fill="none" stroke="#D4AF37" strokeOpacity="0.25">
              <path d="M-10 170 C 80 140, 140 200, 230 150 S 360 90, 420 120" strokeWidth="6" />
              <path d="M60 -10 C 90 80, 70 160, 120 260" strokeWidth="3" />
              <path d="M300 -10 C 280 70, 330 140, 300 260" strokeWidth="3" />
              <path d="M-10 60 L 420 90" strokeWidth="1.5" />
              <path d="M-10 220 L 420 200" strokeWidth="1.5" />
              <path d="M180 -10 L 210 260" strokeWidth="1.5" />
            </g>
          </svg>
          <span className="grid size-14 place-items-center rounded-full border border-gold/50 bg-ink/70 text-gold">
            <MapPin size={24} />
          </span>
          <button type="button" onClick={() => setLoaded(true)} className="btn btn-outline min-h-11 bg-ink/60 px-4 py-2.5 whitespace-normal text-center">
            {t('load')}
          </button>
          <p className="max-w-xs text-xs leading-relaxed text-mist">{t('notice')}</p>
        </div>
      )}
      <a
        href={googleMapsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 bottom-3 z-10 bg-ink/85 px-3 py-1.5 text-[0.65rem] tracking-[0.18em] text-gold uppercase backdrop-blur"
      >
        {t('open')} ↗
      </a>
    </div>
  );
}
