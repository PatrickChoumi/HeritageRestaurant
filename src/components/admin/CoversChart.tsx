'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateLong, formatDateShort } from '@/lib/format';

export interface CoversDay {
  date: string;
  lunch: number;
  dinner: number;
}

// Palette validée (scripts/validate_palette.js, surface #151515, mode sombre) :
// toutes les vérifications passent, ΔE daltonisme 26,7, contraste ≥ 3:1.
const SERIES = [
  { key: 'lunch', label: 'Déjeuner', color: '#3987e5' },
  { key: 'dinner', label: 'Dîner', color: '#B08D2C' },
] as const;

const HEIGHT = 240;
const PAD = { top: 28, right: 8, bottom: 34, left: 34 };
const GAP = 2;

function niceMax(value: number): number {
  if (value <= 10) return 10;
  const step = value <= 50 ? 10 : value <= 150 ? 25 : 50;
  return Math.ceil(value / step) * step;
}

/** Couverts réservés par jour (14 jours), empilés déjeuner / dîner. */
export function CoversChart({ data }: { data: CoversDay[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => entry && setWidth(Math.max(320, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totals = data.map((d) => d.lunch + d.dinner);
  const max = niceMax(Math.max(...totals, 1));
  const ticks = useMemo(() => Array.from({ length: 5 }, (_, i) => Math.round((max / 4) * i)), [max]);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const band = innerW / data.length;
  const barW = Math.min(24, band * 0.56);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const peak = totals.indexOf(Math.max(...totals));
  const showEvery = band < 34 ? 2 : 1;

  const hovered = hover !== null ? data[hover] : null;
  // Info-bulle à côté de la colonne survolée (jamais par-dessus), à gauche si elle déborderait
  const TIP_W = 176;
  const columnRight = hover !== null ? PAD.left + band * (hover + 1) : 0;
  const tooltipLeft =
    hover !== null ? (columnRight + 8 + TIP_W > width ? PAD.left + band * hover - 8 - TIP_W : columnRight + 8) : 0;

  return (
    <figure className="relative">
      <div className="mb-4 flex flex-wrap items-center gap-5 text-xs text-mist" aria-hidden="true">
        {[...SERIES].reverse().map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-[2px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div ref={box} className="relative">
        <svg
          width={width}
          height={HEIGHT}
          role="group"
          aria-label="Couverts réservés sur les 14 prochains jours"
          className="block max-w-full"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="#2a2927" strokeWidth={1} />
              <text
                x={PAD.left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-mist text-[10px] tabular-nums"
              >
                {t}
              </text>
            </g>
          ))}
          <g role="list">
            {data.map((d, i) => {
              const cx = PAD.left + band * i + band / 2;
              const x = cx - barW / 2;
              const lunchTop = y(d.lunch);
              const lunchH = PAD.top + innerH - lunchTop;
              const dinnerH = (d.dinner / max) * innerH;
              const dinnerTop = lunchTop - dinnerH - (d.lunch > 0 && d.dinner > 0 ? GAP : 0);
              const parts = formatDateShort('fr', d.date);
              const label = `${formatDateLong('fr', d.date)} : ${d.dinner} au dîner, ${d.lunch} au déjeuner, ${d.lunch + d.dinner} au total`;
              const topIsDinner = d.dinner > 0;
              return (
                <g
                  key={d.date}
                  tabIndex={0}
                  role="listitem"
                  aria-label={label}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="cursor-default outline-none"
                >
                  {/* Zone de survol : toute la colonne */}
                  <rect
                    x={PAD.left + band * i}
                    y={PAD.top}
                    width={band}
                    height={innerH}
                    fill={hover === i ? 'rgba(245,245,245,0.04)' : 'transparent'}
                  />
                  {d.lunch > 0 && (
                    <path
                      d={roundedTop(x, lunchTop, barW, lunchH, topIsDinner ? 0 : 4)}
                      fill={SERIES[0].color}
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )}
                  {d.dinner > 0 && (
                    <path
                      d={roundedTop(x, dinnerTop, barW, dinnerH, 4)}
                      fill={SERIES[1].color}
                      opacity={hover === null || hover === i ? 1 : 0.55}
                    />
                  )}
                  {i === peak && totals[i]! > 0 && (
                    <text
                      x={cx}
                      y={dinnerTop - 8}
                      textAnchor="middle"
                      className="fill-ivory text-[11px] font-medium tabular-nums"
                    >
                      {totals[i]}
                    </text>
                  )}
                  {i % showEvery === 0 && (
                    <text x={cx} y={HEIGHT - 12} textAnchor="middle" className="fill-mist text-[10px]">
                      {parts.weekday.slice(0, 3)} {parts.day}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        {hovered && (
          <div
            className="pointer-events-none absolute top-6 z-10 w-44 border border-ivory/15 bg-ink/95 px-3 py-2.5 text-xs shadow-xl"
            style={{ left: tooltipLeft }}
            aria-hidden="true"
          >
            <p className="mb-1.5 text-mist first-letter:uppercase">{formatDateLong('fr', hovered.date)}</p>
            {[...SERIES].reverse().map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span className="h-0.5 w-3" style={{ background: s.color }} />
                <span className="font-medium text-ivory tabular-nums">{hovered[s.key]}</span>
                <span className="text-mist">{s.label.toLowerCase()}</span>
              </p>
            ))}
            <p className="mt-1.5 border-t border-ivory/10 pt-1.5 text-mist">
              <span className="font-medium text-ivory tabular-nums">{hovered.lunch + hovered.dinner}</span> couverts
            </p>
          </div>
        )}
      </div>
      <details className="mt-4 text-xs text-mist">
        <summary className="cursor-pointer hover:text-ivory">Voir les données en tableau</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="border-b border-ivory/10">
              <th className="py-1.5 font-normal">Jour</th>
              <th className="py-1.5 text-right font-normal">Déjeuner</th>
              <th className="py-1.5 text-right font-normal">Dîner</th>
              <th className="py-1.5 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-b border-ivory/[0.05] text-ivory/85">
                <td className="py-1.5 first-letter:uppercase">{formatDateLong('fr', d.date)}</td>
                <td className="py-1.5 text-right tabular-nums">{d.lunch}</td>
                <td className="py-1.5 text-right tabular-nums">{d.dinner}</td>
                <td className="py-1.5 text-right tabular-nums">{d.lunch + d.dinner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Rectangle à extrémité haute arrondie, base carrée sur la ligne de base. */
function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return '';
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}
