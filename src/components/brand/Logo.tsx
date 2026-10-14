// Identité Héritage : monogramme « H » dans un double cercle + logotype Cinzel or métallique.
import { cn } from '@/lib/cn';

export function Monogram({ className, draw = false }: { className?: string; draw?: boolean }) {
  const stroke = draw ? 'stroke-draw' : undefined;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="heritage-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E9CF75" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A8862A" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#heritage-gold)" strokeLinecap="square">
        <circle className={stroke} cx="50" cy="50" r="46" strokeWidth="1.2" />
        <circle className={stroke} cx="50" cy="50" r="41" strokeWidth="0.5" />
        <path className={stroke} d="M36 30v40M64 30v40M36 50h28" strokeWidth="2.2" />
        <path className={stroke} d="M31 30h10M59 30h10M31 70h10M59 70h10" strokeWidth="1.2" />
        <path className={stroke} d="M50 14l3 4-3 4-3-4z M50 78l3 4-3 4-3-4z" strokeWidth="0.9" />
      </g>
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-3 text-gold', className)}>
      <Monogram className="size-9 shrink-0 md:size-10" />
      <span className="flex flex-col leading-none">
        <span className="font-logo text-[1.15rem] font-medium tracking-[0.34em] md:text-[1.3rem]">HÉRITAGE</span>
        {!compact && (
          <span className="mt-1.5 font-sans text-[0.55rem] tracking-[0.42em] text-mist uppercase">Bastos · Yaoundé</span>
        )}
      </span>
    </span>
  );
}
