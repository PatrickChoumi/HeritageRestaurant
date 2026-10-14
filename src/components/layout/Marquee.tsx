import { Link } from '@/i18n/navigation';

/** Bandeau défilant « Réserver une table » (inspiré des grandes maisons). */
export function Marquee({ label }: { label: string }) {
  const items = Array.from({ length: 8 });
  return (
    <Link
      href="/reservation"
      className="group no-print relative block overflow-hidden border-y border-gold/15 bg-coal py-7"
      aria-label={label}
    >
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        aria-hidden="true"
      >
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {items.map((_, i) => (
              <span key={i} className="flex items-center">
                <span className="px-8 font-display text-4xl font-light text-ivory/90 italic transition-colors duration-500 group-hover:text-gold md:text-6xl">
                  {label}
                </span>
                <span className="text-xl text-gold">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </Link>
  );
}
