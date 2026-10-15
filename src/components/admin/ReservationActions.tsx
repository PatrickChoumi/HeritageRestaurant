'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { setReservationStatus } from '@/app/admin/actions';
import { WhatsApp } from '@/components/icons';
import { clientWhatsappUrl, type ClientContact } from '@/lib/admin/client-messages';
import type { ReservationStatus } from '@/lib/db/schema';
import { cn } from '@/lib/cn';

type Action = { status: ReservationStatus; label: string; tone: 'gold' | 'ghost' | 'danger'; notify?: boolean };

const ACTIONS: Record<ReservationStatus, Action[]> = {
  pending: [
    { status: 'confirmed', label: 'Confirmer', tone: 'gold', notify: true },
    { status: 'cancelled', label: 'Refuser', tone: 'danger', notify: true },
  ],
  confirmed: [
    { status: 'completed', label: 'Honorée', tone: 'ghost' },
    { status: 'no_show', label: 'Absent', tone: 'ghost' },
    { status: 'cancelled', label: 'Annuler', tone: 'danger', notify: true },
  ],
  completed: [{ status: 'confirmed', label: 'Rétablir', tone: 'ghost' }],
  no_show: [{ status: 'completed', label: 'Marquer honorée', tone: 'ghost' }],
  cancelled: [{ status: 'pending', label: 'Rétablir', tone: 'ghost' }],
};

/** Boutons de changement de statut, avec e-mail au client (confirmation / annulation). */
export function ReservationActions({
  reservation,
  status,
  compact = false,
}: {
  reservation: ClientContact & { id: number };
  status: ReservationStatus;
  compact?: boolean;
}) {
  const router = useRouter();
  const [notify, setNotify] = useState(true);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = (action: Action) => {
    if (action.tone === 'danger' && !window.confirm(`${action.label} la réservation ${reservation.reference} ?`))
      return;
    startTransition(async () => {
      const result = await setReservationStatus(reservation.id, action.status, Boolean(action.notify && notify));
      if (!result.ok) setMessage('Action impossible, rechargez la page.');
      else if (action.notify && notify)
        setMessage(result.emailed ? 'Client prévenu par e-mail.' : 'Statut enregistré, mais l’e-mail n’est pas parti.');
      else setMessage(null);
      router.refresh();
    });
  };

  const actions = ACTIONS[status];
  const needsNotify = actions.some((a) => a.notify);

  return (
    <div className={cn('flex flex-col gap-2', compact ? 'items-start sm:items-end' : 'items-start')}>
      <div className={cn('flex items-center gap-1.5', compact ? 'flex-wrap sm:flex-nowrap' : 'flex-wrap gap-2')}>
        {actions.map((a) => (
          <button
            key={a.status}
            type="button"
            disabled={pending}
            onClick={() => run(a)}
            className={cn(
              'cursor-pointer border tracking-wide whitespace-nowrap transition-colors disabled:cursor-wait disabled:opacity-50',
              compact ? 'min-h-8 px-2.5 text-[0.7rem]' : 'min-h-9 px-3 text-xs',
              a.tone === 'gold' && 'border-gold bg-gold text-ink hover:bg-gold-light',
              a.tone === 'ghost' && 'border-ivory/20 text-ivory/85 hover:border-ivory/50',
              a.tone === 'danger' && 'border-danger/40 text-danger hover:bg-danger/10',
            )}
          >
            {a.label}
          </button>
        ))}
        <a
          href={clientWhatsappUrl(
            reservation,
            status === 'cancelled' ? 'cancel' : status === 'pending' ? 'confirm' : 'contact',
          )}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'grid shrink-0 place-items-center border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10',
            compact ? 'size-8' : 'size-9',
          )}
          aria-label={`Écrire à ${reservation.firstName} sur WhatsApp`}
          title="WhatsApp"
        >
          <WhatsApp size={16} />
        </a>
      </div>
      {needsNotify && !compact && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-mist">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="accent-gold"
          />
          Prévenir le client par e-mail
        </label>
      )}
      {message && (
        <p role="status" className="text-xs text-gold">
          {message}
        </p>
      )}
    </div>
  );
}
