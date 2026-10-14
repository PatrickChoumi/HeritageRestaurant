import type { ReservationStatus } from '@/lib/db/schema';
import { cn } from '@/lib/cn';

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  completed: 'Honorée',
  cancelled: 'Annulée',
  no_show: 'Absent',
};

// Couleurs d'état réservées (jamais seules : toujours un symbole et un libellé)
const STYLES: Record<ReservationStatus, { className: string; symbol: string }> = {
  pending: { className: 'border-[#e0a43a]/50 text-[#f0c070]', symbol: '◔' },
  confirmed: { className: 'border-success/50 text-success', symbol: '✓' },
  completed: { className: 'border-ivory/20 text-mist', symbol: '●' },
  cancelled: { className: 'border-danger/50 text-danger', symbol: '✕' },
  no_show: { className: 'border-[#d97a4a]/50 text-[#e99a6e]', symbol: '!' },
};

export function StatusBadge({ status, className }: { status: ReservationStatus; className?: string }) {
  const style = STYLES[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 border px-2 py-0.5 text-[0.7rem] whitespace-nowrap', style.className, className)}>
      <span aria-hidden="true">{style.symbol}</span>
      {STATUS_LABELS[status]}
    </span>
  );
}
