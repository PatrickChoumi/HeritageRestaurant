import type { Metadata } from 'next';
import Link from 'next/link';
import { NoteForm } from '@/components/admin/NoteForm';
import { ReservationActions } from '@/components/admin/ReservationActions';
import { ResendButton } from '@/components/admin/ResendButton';
import { STATUS_LABELS, StatusBadge } from '@/components/admin/StatusBadge';
import { Close, Mail, Phone, WhatsApp } from '@/components/icons';
import { requireAdmin } from '@/lib/auth/session';
import { listReservations, type ReservationRange } from '@/lib/admin/queries';
import { clientWhatsappUrl } from '@/lib/admin/client-messages';
import { getReservation } from '@/lib/reservations/service';
import { clientReservationEmail } from '@/lib/email/templates';
import { toEmailData } from '@/lib/reservations/notify';
import { formatDateLong, formatTime } from '@/lib/format';
import { formatPhone } from '@/lib/reservations/validation';
import { reservationStatusEnum, type ReservationStatus } from '@/lib/db/schema';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Réservations' };

const RANGES: { key: ReservationRange; label: string }[] = [
  { key: 'today', label: 'Aujourd’hui' },
  { key: 'tomorrow', label: 'Demain' },
  { key: 'week', label: '7 jours' },
  { key: 'upcoming', label: 'À venir' },
  { key: 'past', label: 'Passées' },
  { key: 'all', label: 'Toutes' },
];

const OCCASIONS: Record<string, string> = {
  birthday: 'Anniversaire',
  business: 'Repas d’affaires',
  romantic: 'Dîner en amoureux',
  celebration: 'Célébration',
  other: 'Autre',
};

const dateTime = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Douala' }).format(d) : '—';

export default async function ReservationsPage({ searchParams }: PageProps<'/admin/reservations'>) {
  await requireAdmin();
  const params = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);
  const range = (RANGES.find((r) => r.key === str(params.range))?.key ?? 'upcoming') as ReservationRange;
  const statusParam = str(params.status);
  const status = (reservationStatusEnum.enumValues as string[]).includes(statusParam ?? '') ? (statusParam as ReservationStatus) : undefined;
  const q = str(params.q)?.slice(0, 80);
  const selectedId = Number(str(params.id));

  const [rows, selected] = await Promise.all([
    listReservations({ range, status, q }),
    Number.isInteger(selectedId) && selectedId > 0 ? getReservation(selectedId) : undefined,
  ]);

  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { range, status, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    return `/admin/reservations?${next.toString()}`;
  };

  const covers = rows.filter((r) => r.status === 'pending' || r.status === 'confirmed').reduce((s, r) => s + r.guests, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="title-md">Réservations</h1>
          <p className="mt-1 text-sm text-mist">
            {rows.length} réservation(s) · {covers} couverts actifs
          </p>
        </div>
      </header>

      {/* Filtres : une seule ligne, au-dessus de la liste */}
      <form method="get" className="mt-8 flex flex-wrap items-end gap-3 border-b border-ivory/10 pb-6">
        <nav aria-label="Période" className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={link({ range: r.key, id: undefined })}
              aria-current={r.key === range ? 'true' : undefined}
              className={cn(
                'min-h-9 border px-3 py-2 text-xs transition-colors',
                r.key === range ? 'border-gold bg-gold text-ink' : 'border-ivory/15 text-ivory/80 hover:border-gold/50',
              )}
            >
              {r.label}
            </Link>
          ))}
        </nav>
        <input type="hidden" name="range" value={range} />
        <label className="sr-only" htmlFor="status">
          Statut
        </label>
        <select id="status" name="status" defaultValue={status ?? ''} className="min-h-9 border border-ivory/15 bg-coal px-3 text-xs">
          <option value="">Tous les statuts</option>
          {reservationStatusEnum.enumValues.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="q">
          Rechercher
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Nom, téléphone, e-mail, référence…"
          className="min-h-9 min-w-56 flex-1 border border-ivory/15 bg-coal px-3 text-xs placeholder:text-mist"
        />
        <button type="submit" className="min-h-9 cursor-pointer border border-gold/60 px-4 text-xs text-gold hover:bg-gold hover:text-ink">
          Filtrer
        </button>
      </form>

      <div className={cn('mt-6 grid gap-8', selected && 'xl:grid-cols-[minmax(0,1fr)_26rem]')}>
        {/* Liste */}
        <div className="min-w-0">
          {rows.length === 0 ? (
            <p className="border border-dashed border-ivory/15 p-10 text-center text-sm text-mist">Aucune réservation pour ces critères.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead className="hidden text-left text-xs text-mist md:table-header-group">
                <tr className="border-b border-ivory/10">
                  <th className="py-3 pr-4 font-normal">Date</th>
                  <th className="py-3 pr-4 font-normal">Client</th>
                  <th className="py-3 pr-4 text-right font-normal">Couverts</th>
                  <th className="py-3 pr-4 font-normal">Statut</th>
                  <th className="py-3 font-normal">Référence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={cn(
                      'grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-ivory/[0.07] py-3 md:table-row',
                      r.id === selected?.id && 'bg-gold/[0.06]',
                    )}
                  >
                    <td className="md:py-3 md:pr-4">
                      <Link href={link({ id: String(r.id) })} className="hover:text-gold">
                        <span className="first-letter:uppercase">{formatDateLong('fr', r.date)}</span>
                        <span className="ml-2 text-gold tabular-nums">{formatTime('fr', r.time)}</span>
                      </Link>
                    </td>
                    <td className="col-start-1 md:py-3 md:pr-4">
                      <Link href={link({ id: String(r.id) })} className="text-ivory hover:text-gold">
                        {r.firstName} {r.lastName}
                      </Link>
                      <span className="block text-xs text-mist">{formatPhone(r.phone)}</span>
                    </td>
                    <td className="row-start-1 text-right tabular-nums md:py-3 md:pr-4">{r.guests}</td>
                    <td className="row-start-2 md:py-3 md:pr-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="hidden text-xs text-mist md:table-cell md:py-3">{r.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fiche détaillée */}
        {selected && (
          <aside aria-label={`Réservation ${selected.reference}`} className="self-start border border-gold/25 bg-coal xl:sticky xl:top-6">
            <div className="flex items-start justify-between gap-4 border-b border-ivory/10 p-5">
              <div>
                <p className="font-logo text-lg tracking-[0.14em] text-gold">{selected.reference}</p>
                <p className="mt-1 text-xs text-mist">Reçue le {dateTime(selected.createdAt)}</p>
              </div>
              <Link href={link({ id: undefined })} className="grid size-9 place-items-center border border-ivory/15 text-mist hover:text-ivory" aria-label="Fermer la fiche">
                <Close size={16} />
              </Link>
            </div>
            <div className="space-y-6 p-5">
              <div>
                <StatusBadge status={selected.status} />
                <p className="mt-3 font-display text-2xl first-letter:uppercase">
                  {formatDateLong('fr', selected.date, true)} · {formatTime('fr', selected.time)}
                </p>
                <p className="text-sm text-mist">
                  {selected.guests} couvert(s) · {selected.service === 'lunch' ? 'déjeuner' : 'dîner'} · client{' '}
                  {selected.locale === 'fr' ? 'francophone' : 'anglophone'}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-ivory">
                  {selected.firstName} {selected.lastName}
                </p>
                <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-ivory/85 hover:text-gold">
                  <Phone size={15} className="text-gold" /> {formatPhone(selected.phone)}
                </a>
                <a href={clientWhatsappUrl(selected, 'contact')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ivory/85 hover:text-gold">
                  <WhatsApp size={15} className="text-[#25D366]" /> WhatsApp
                </a>
                <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Votre réservation ${selected.reference}`)}`} className="flex items-center gap-2 break-all text-ivory/85 hover:text-gold">
                  <Mail size={15} className="shrink-0 text-gold" /> {selected.email}
                </a>
              </div>

              {(selected.occasion || selected.requests) && (
                <div className="border-l-2 border-gold/50 pl-4 text-sm">
                  {selected.occasion && <p className="text-gold">{OCCASIONS[selected.occasion] ?? selected.occasion}</p>}
                  {selected.requests && <p className="mt-1 whitespace-pre-line text-ivory/85">{selected.requests}</p>}
                </div>
              )}

              <ReservationActions status={selected.status} reservation={selected} />

              <NoteForm key={selected.id} id={selected.id} initial={selected.internalNote ?? ''} />

              <div className="space-y-3 border-t border-ivory/10 pt-5 text-xs text-mist">
                <p className="label">Notifications</p>
                <ul className="space-y-1">
                  <li>E-mail au client : {selected.clientEmailSentAt ? `envoyé le ${dateTime(selected.clientEmailSentAt)}` : 'non envoyé'}</li>
                  <li>Alerte au restaurant : {selected.restaurantEmailSentAt ? `envoyée le ${dateTime(selected.restaurantEmailSentAt)}` : 'non envoyée'}</li>
                  {selected.whatsappNotifiedAt && <li>WhatsApp (Twilio) : envoyé le {dateTime(selected.whatsappNotifiedAt)}</li>}
                  {selected.lastEmailError && <li className="text-danger">Dernière erreur : {selected.lastEmailError}</li>}
                </ul>
                <ResendButton id={selected.id} />
              </div>

              <details className="border-t border-ivory/10 pt-5">
                <summary className="cursor-pointer text-xs text-gold">Aperçu de l’e-mail envoyé au client</summary>
                <iframe
                  title="Aperçu de l’e-mail"
                  sandbox=""
                  srcDoc={clientReservationEmail(selected.status === 'confirmed' ? 'confirmed' : selected.status === 'cancelled' ? 'cancelled' : 'received', toEmailData(selected)).html}
                  className="mt-4 h-[36rem] w-full border border-ivory/10 bg-ink"
                />
              </details>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
