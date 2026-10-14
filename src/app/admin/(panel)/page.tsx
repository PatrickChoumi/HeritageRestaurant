import type { Metadata } from 'next';
import Link from 'next/link';
import { CoversChart } from '@/components/admin/CoversChart';
import { ReservationActions } from '@/components/admin/ReservationActions';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ArrowRight } from '@/components/icons';
import { requireAdmin } from '@/lib/auth/session';
import { dashboard } from '@/lib/admin/queries';
import { formatDateLong, formatTime } from '@/lib/format';
import { formatPhone } from '@/lib/reservations/validation';
import { restaurant } from '@/lib/restaurant';
import { restaurantNow } from '@/lib/reservations/time';

export const metadata: Metadata = { title: 'Tableau de bord' };

function greeting(minutes: number) {
  if (minutes < 12 * 60) return 'Bonjour';
  if (minutes < 18 * 60) return 'Bon après-midi';
  return 'Bonsoir';
}

export default async function DashboardPage() {
  const session = await requireAdmin();
  const data = await dashboard(14);
  const now = restaurantNow();
  const { kpis } = data;
  const dinnerFill = Math.min(100, Math.round((kpis.coversToday.dinner / restaurant.reservation.capacityPerService) * 100));

  const tiles = [
    { label: 'Réservations aujourd’hui', value: kpis.bookingsToday, detail: `${kpis.coversToday.lunch + kpis.coversToday.dinner} couverts` },
    { label: 'Couverts au déjeuner', value: kpis.coversToday.lunch, detail: `sur ${restaurant.reservation.capacityPerService} places` },
    { label: 'Couverts au dîner', value: kpis.coversToday.dinner, detail: `sur ${restaurant.reservation.capacityPerService} places`, meter: dinnerFill },
    { label: 'Sur 7 jours', value: kpis.coversWeek, detail: `${kpis.bookingsWeek} réservations` },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mist first-letter:uppercase">{formatDateLong('fr', data.today, true)}</p>
          <h1 className="title-md mt-1">
            {greeting(now.minutes)}, {session.user.name}
          </h1>
        </div>
        <Link href="/admin/reservations" className="btn btn-outline min-h-10 px-4 py-2">
          Toutes les réservations
        </Link>
      </header>

      {data.emailFailures > 0 && (
        <p role="alert" className="border-l-2 border-[#e0a43a] bg-[#e0a43a]/10 px-4 py-3 text-sm">
          ⚠ {data.emailFailures} réservation(s) à venir n’ont pas reçu tous leurs e-mails. Ils sont retentés automatiquement ;
          vous pouvez aussi les renvoyer depuis la fiche de la réservation.
        </p>
      )}

      {/* Indicateurs */}
      <section aria-label="Indicateurs du jour" className="grid grid-cols-2 gap-px border border-ivory/10 bg-ivory/10 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-coal p-5 md:p-6">
            <p className="text-xs text-mist">{tile.label}</p>
            <p className="mt-2 font-sans text-4xl font-semibold text-ivory md:text-5xl">{tile.value}</p>
            <p className="mt-1 text-xs text-mist">{tile.detail}</p>
            {tile.meter !== undefined && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gold/15" role="meter" aria-valuenow={tile.meter} aria-valuemin={0} aria-valuemax={100} aria-label="Remplissage du dîner">
                <div className="h-full rounded-full bg-gold" style={{ width: `${tile.meter}%` }} />
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="grid gap-10 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Service du jour */}
        <section aria-labelledby="today-title" className="min-w-0">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="today-title" className="font-display text-2xl">
              Service du jour
            </h2>
            <span className="text-xs text-mist">{data.todayList.length} réservation(s)</span>
          </div>
          {data.todayList.length === 0 ? (
            <p className="border border-dashed border-ivory/15 p-8 text-center text-sm text-mist">Aucune réservation aujourd’hui pour le moment.</p>
          ) : (
            <ol className="divide-y divide-ivory/[0.07] border border-ivory/10 bg-coal">
              {data.todayList.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
                  <div className="flex items-center gap-4 sm:w-56 sm:shrink-0">
                    <span className="font-display text-2xl text-gold tabular-nums">{formatTime('fr', r.time)}</span>
                    <div className="min-w-0">
                      <Link href={`/admin/reservations?id=${r.id}`} className="block truncate text-sm text-ivory hover:text-gold">
                        {r.firstName} {r.lastName}
                      </Link>
                      <p className="text-xs text-mist">
                        {r.guests} pers. · {r.service === 'lunch' ? 'déjeuner' : 'dîner'}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-xs text-mist">
                    <StatusBadge status={r.status} />
                    {r.occasion && <span className="chip">{r.occasion === 'birthday' ? 'Anniversaire' : r.occasion === 'business' ? 'Affaires' : 'Occasion'}</span>}
                    {r.requests && (
                      <span className="w-full truncate" title={r.requests}>
                        « {r.requests} »
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    <ReservationActions compact status={r.status} reservation={r} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* À confirmer */}
        <section aria-labelledby="pending-title">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="pending-title" className="font-display text-2xl">
              À confirmer
            </h2>
            <Link href="/admin/reservations?status=pending" className="text-xs text-gold hover:text-gold-light">
              Tout voir
            </Link>
          </div>
          {data.pendingList.length === 0 ? (
            <p className="border border-dashed border-ivory/15 p-6 text-center text-sm text-mist">Tout est confirmé ✓</p>
          ) : (
            <ul className="space-y-2">
              {data.pendingList.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/reservations?id=${r.id}`}
                    className="group flex items-center justify-between gap-3 border border-ivory/10 bg-coal p-4 transition-colors hover:border-gold/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ivory">
                        {r.firstName} {r.lastName} · {r.guests} pers.
                      </span>
                      <span className="block text-xs text-mist first-letter:uppercase">
                        {formatDateLong('fr', r.date)} · {formatTime('fr', r.time)}
                      </span>
                      <span className="block text-xs text-mist">{formatPhone(r.phone)}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-gold transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="chart-title" className="border border-ivory/10 bg-[#151515] p-5 md:p-7">
        <h2 id="chart-title" className="font-display text-2xl">
          Couverts réservés · 14 prochains jours
        </h2>
        <p className="mt-1 mb-6 text-xs text-mist">Réservations en attente et confirmées.</p>
        <CoversChart data={data.series} />
      </section>
    </div>
  );
}
