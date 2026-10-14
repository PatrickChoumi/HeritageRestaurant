'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, useTransition } from 'react';
import { submitReservation, type BookingFailure, type BookingResult } from '@/app/actions/booking';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowRight, Calendar, Check, Users, WhatsApp } from '@/components/icons';
import { restaurant, whatsappUrl, type ServiceId } from '@/lib/restaurant';
import {
  addDays,
  checkBookable,
  restaurantNow,
  servicesFor,
  type Availability,
  type SlotAvailability,
} from '@/lib/reservations/time';
import { fieldErrors, OCCASIONS, REQUESTS_MAX, reservationSchema, type Occasion } from '@/lib/reservations/validation';
import { buildIcs } from '@/lib/reservations/ics';
import { formatDateLong, formatDateShort, formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';

type Step = 'table' | 'details' | 'done';
type Success = Extract<BookingResult, { ok: true }>;
type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'requests' | 'consent';

const STEPS: Step[] = ['table', 'details', 'done'];
const STRIP_DAYS = 14;
const EASE = [0.22, 1, 0.36, 1] as const;
const { maxGuestsOnline, maxDaysAhead, minLeadMinutes } = restaurant.reservation;

interface Details {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occasion?: Occasion;
  requests: string;
  consent: boolean;
  website: string;
}

const EMPTY: Details = { firstName: '', lastName: '', email: '', phone: '', requests: '', consent: false, website: '' };

const noopSubscribe = () => () => {};

/** Premier jour (dans la fenêtre de réservation) qui propose au moins un créneau réservable. */
function firstBookableDate(today: string): string {
  const now = restaurantNow();
  for (let i = 0; i <= maxDaysAhead; i += 1) {
    const date = addDays(today, i);
    if (servicesFor(date).some((s) => s.slots.some((time) => checkBookable(date, time, 2, now) === null))) return date;
  }
  return today;
}

export function BookingForm({ className }: { className?: string }) {
  const t = useTranslations('Booking');
  const locale = useLocale() as 'fr' | 'en';
  const reduce = useReducedMotion();
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);

  // « Aujourd'hui » à Yaoundé, lu dans le navigateur : la page peut rester statique (null côté serveur)
  const today = useSyncExternalStore(noopSubscribe, () => restaurantNow().date, () => null);
  const defaultDate = useMemo(() => (today ? firstBookableDate(today) : null), [today]);

  const [step, setStep] = useState<Step>('table');
  const [guests, setGuests] = useState(2);
  const [showGroup, setShowGroup] = useState(false);
  const [pickedDate, setDate] = useState<string | null>(null);
  const [pickedService, setService] = useState<ServiceId | null>(null);
  const [slot, setSlot] = useState<{ service: ServiceId; time: string } | null>(null);
  const [response, setResponse] = useState<{ key: string; data?: Availability; error?: boolean } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<BookingFailure | 'network' | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const date = pickedDate ?? defaultDate;
  const requestKey = date ? `${date}|${guests}|${refresh}` : null;
  const current = response && response.key === requestKey ? response : null;
  const availability = current?.data ?? (response?.data?.date === date ? response.data : null);
  const loading = Boolean(requestKey) && !current;
  const loadError = Boolean(current?.error);

  // Service affiché : celui choisi, sinon le premier qui a encore de la place (dîner de préférence)
  const isOpen = (id: ServiceId) =>
    availability?.services.find((s) => s.id === id)?.slots.some((s) => s.status === 'available' || s.status === 'limited');
  const service: ServiceId = pickedService ?? (isOpen('dinner') || !isOpen('lunch') ? 'dinner' : 'lunch');

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Disponibilités en temps réel pour la date et le nombre de convives choisis
  useEffect(() => {
    if (!requestKey || !date) return;
    const controller = new AbortController();
    fetch(`/api/availability?date=${date}&guests=${guests}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Availability) => {
        setResponse({ key: requestKey, data });
        // Un créneau choisi qui n'est plus disponible est désélectionné
        setSlot((selected) => {
          if (!selected) return selected;
          const match = data.services.find((s) => s.id === selected.service)?.slots.find((s) => s.time === selected.time);
          return match && (match.status === 'available' || match.status === 'limited') ? selected : null;
        });
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setResponse({ key: requestKey, error: true });
      });
    return () => controller.abort();
  }, [requestKey, date, guests]);

  // Remonte en haut du module à chaque changement d'étape (pas au premier affichage)
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const el = rootRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) {
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }, [step, reduce]);

  const stripDates = useMemo(() => {
    if (!today) return [];
    const list = Array.from({ length: STRIP_DAYS }, (_, i) => addDays(today, i));
    if (date && !list.includes(date)) list.push(date);
    return list;
  }, [today, date]);

  /* --------------------------------------------------------- Validation */

  const payload = {
    ...details,
    date: date ?? '',
    time: slot?.time ?? '',
    guests,
    locale,
    requests: details.requests || undefined,
  };
  const clientErrors = useMemo(() => {
    const parsed = reservationSchema.safeParse(payload);
    return parsed.success ? {} : fieldErrors(parsed.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, date, slot, guests, locale]);

  const errorFor = (field: Field): string | undefined => {
    const code = serverErrors[field] ?? ((touched[field] || submitted) ? clientErrors[field] : undefined);
    if (!code) return undefined;
    if (field === 'consent') return t('errors.consent');
    if (code === 'required') return t('errors.required');
    if (code === 'tooLong') return t('errors.tooLong');
    if (field === 'email') return t('errors.email');
    if (field === 'phone') return t('errors.phone');
    if (field === 'firstName' || field === 'lastName') return t('errors.name');
    return t('errors.invalid');
  };

  const update = <K extends keyof Details>(key: K, value: Details[K]) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setServerErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const failureText = (f: BookingFailure | 'network') => {
    switch (f) {
      case 'dateTooFar':
        return t('bookingErrors.dateTooFar', { days: maxDaysAhead });
      case 'tooSoon':
        return t('bookingErrors.tooSoon', { minutes: minLeadMinutes });
      case 'groupTooLarge':
        return t('bookingErrors.groupTooLarge', { max: maxGuestsOnline });
      default:
        return t(`bookingErrors.${f}`);
    }
  };

  /* ------------------------------------------------------------ Envoi */

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setFailure(null);
    const fields: Field[] = ['firstName', 'lastName', 'email', 'phone', 'requests', 'consent'];
    const invalid = fields.find((f) => clientErrors[f]);
    if (invalid) {
      document.getElementById(`${uid}-${invalid}`)?.focus();
      return;
    }
    startTransition(async () => {
      try {
        const result = await submitReservation({ ...payload, elapsed: Date.now() - startedAt.current });
        if (result.ok) {
          setSuccess(result);
          setStep('done');
          return;
        }
        if (result.fieldErrors) {
          setServerErrors(result.fieldErrors);
          if (result.fieldErrors.date || result.fieldErrors.time || result.fieldErrors.guests) {
            setFailure('slotInvalid');
            setStep('table');
          }
          return;
        }
        if (result.error) {
          setFailure(result.error);
          if (result.error === 'full' || result.error === 'tooSoon' || result.error === 'slotInvalid') {
            setSlot(null);
            setStep('table');
            setRefresh((n) => n + 1);
          }
        }
      } catch {
        setFailure('network');
      }
    });
  };

  const reset = () => {
    setDetails(EMPTY);
    setTouched({});
    setSubmitted(false);
    setServerErrors({});
    setFailure(null);
    setSuccess(null);
    setSlot(null);
    setStep('table');
    setRefresh((n) => n + 1);
    startedAt.current = Date.now();
  };

  const downloadIcs = () => {
    if (!success) return;
    const ics = buildIcs({
      reference: success.reference,
      date: success.date,
      time: success.time,
      durationMinutes: restaurant.reservation.durationMinutes,
      title: t('calendarTitle', { service: success.service }),
      description: t('calendarDescription', {
        reference: success.reference,
        guests: success.guests,
        phone: restaurant.phone.display,
      }),
      location: `${restaurant.name}, ${restaurant.address.street}, ${restaurant.address.locality}`,
      url: restaurant.siteUrl,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `heritage-${success.reference}.ics`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyReference = async () => {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  /* ------------------------------------------------------------ Rendu */

  const stepIndex = STEPS.indexOf(step);
  const currentService = availability?.services.find((s) => s.id === service);
  const bookable = (s: SlotAvailability) => s.status === 'available' || s.status === 'limited';

  return (
    <div ref={rootRef} className={cn('relative scroll-mt-28 border border-gold/20 bg-coal/90 backdrop-blur-sm', className)}>
      {/* Étapes */}
      <ol className="grid grid-cols-3 border-b border-gold/15" aria-label={t('stepOf', { current: stepIndex + 1, total: 3 })}>
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={s === step ? 'step' : undefined}
            className={cn(
              'relative flex items-center justify-center gap-2 px-2 py-4 text-[0.62rem] tracking-[0.2em] uppercase transition-colors sm:gap-3 sm:text-[0.68rem]',
              i <= stepIndex ? 'text-gold' : 'text-mist',
            )}
          >
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full border font-sans text-[0.65rem] tabular-nums',
                i < stepIndex ? 'border-gold bg-gold text-ink' : i === stepIndex ? 'border-gold' : 'border-mist/40',
              )}
            >
              {i < stepIndex ? <Check size={12} strokeWidth={2.4} /> : i + 1}
            </span>
            <span className="hidden sm:inline">{t(`steps.${s}`)}</span>
            {i === stepIndex && (
              <motion.span layoutId={`${uid}-step`} className="absolute inset-x-0 -bottom-px h-px bg-gold" transition={{ duration: 0.6, ease: EASE }} />
            )}
          </li>
        ))}
      </ol>

      <div className="p-5 sm:p-8 md:p-10">
        <AnimatePresence>
          {failure && step !== 'done' && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden border-l-2 border-danger bg-danger/10 px-4 py-3 text-sm text-ivory"
            >
              {failureText(failure)}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {step === 'table' && (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: reduce ? 0 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : -24 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="space-y-10"
            >
              {/* Convives */}
              <fieldset>
                <legend className="label mb-4 flex items-center gap-2">
                  <Users size={15} className="text-gold" /> {t('guests')}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: maxGuestsOnline }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={guests === n && !showGroup}
                      aria-label={t('guestsValue', { count: n })}
                      onClick={() => {
                        setGuests(n);
                        setShowGroup(false);
                      }}
                      className={cn(
                        'grid size-11 cursor-pointer place-items-center border text-sm tabular-nums transition-colors duration-300',
                        guests === n && !showGroup
                          ? 'border-gold bg-gold text-ink'
                          : 'border-ivory/15 text-ivory/85 hover:border-gold/60 hover:text-gold',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={showGroup}
                    onClick={() => setShowGroup(true)}
                    className={cn(
                      'h-11 cursor-pointer border px-4 text-sm transition-colors duration-300',
                      showGroup ? 'border-gold bg-gold text-ink' : 'border-ivory/15 text-ivory/85 hover:border-gold/60 hover:text-gold',
                    )}
                  >
                    {t('more')}
                  </button>
                </div>
                <AnimatePresence>
                  {showGroup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 flex flex-col gap-4 border border-gold/25 bg-gold/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm leading-relaxed text-ivory/90">{t('groupNotice', { max: maxGuestsOnline })}</p>
                        <a
                          href={whatsappUrl(t('groupWhatsappMessage', { max: maxGuestsOnline }))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline min-h-11 shrink-0 px-5 py-2.5"
                        >
                          <WhatsApp size={16} /> {t('groupCta')}
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </fieldset>

              {!showGroup && (
                <>
                  {/* Date */}
                  <fieldset>
                    <legend className="label mb-4 flex items-center gap-2">
                      <Calendar size={15} className="text-gold" /> {t('date')}
                    </legend>
                    <div className="no-scrollbar mask-fade-x -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 md:-mx-10 md:px-10">
                      {stripDates.length === 0
                        ? Array.from({ length: 7 }, (_, i) => (
                            <span key={i} className="h-[4.75rem] w-[4.25rem] shrink-0 animate-shimmer bg-ivory/5" aria-hidden="true" />
                          ))
                        : stripDates.map((d) => {
                            const closed = servicesFor(d).length === 0;
                            const parts = formatDateShort(locale, d);
                            const label =
                              d === today ? t('today') : today && d === addDays(today, 1) ? t('tomorrow') : parts.weekday;
                            return (
                              <button
                                key={d}
                                type="button"
                                disabled={closed}
                                aria-pressed={d === date}
                                aria-label={formatDateLong(locale, d)}
                                onClick={() => {
                                  setDate(d);
                                  setService(null);
                                }}
                                className={cn(
                                  'flex h-[4.75rem] min-w-[4.25rem] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 border px-2.5 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-30',
                                  d === date
                                    ? 'border-gold bg-gold text-ink'
                                    : 'border-ivory/15 text-ivory/85 hover:border-gold/60',
                                )}
                              >
                                <span className="text-[0.6rem] tracking-[0.12em] whitespace-nowrap uppercase">{label}</span>
                                <span className="font-display text-2xl leading-none">{parts.day}</span>
                                <span className="text-[0.62rem] tracking-[0.12em] uppercase">{parts.month}</span>
                              </button>
                            );
                          })}
                      {today && (
                        <label className="relative flex h-[4.75rem] w-[5.5rem] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-ivory/25 text-center text-[0.62rem] tracking-[0.12em] text-ivory/80 uppercase transition-colors hover:border-gold/60 hover:text-gold">
                          <Calendar size={18} className="text-gold" />
                          {t('otherDate')}
                          <input
                            type="date"
                            min={today}
                            max={addDays(today, maxDaysAhead)}
                            value={date ?? ''}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              setDate(e.target.value);
                              setService(null);
                            }}
                            aria-label={t('otherDate')}
                            className="absolute inset-0 cursor-pointer opacity-0"
                          />
                        </label>
                      )}
                    </div>
                  </fieldset>

                  {/* Créneaux */}
                  <fieldset>
                    <legend className="sr-only">{t('time')}</legend>
                    <div className="mb-5 flex items-center gap-6 border-b border-ivory/10" role="tablist" aria-label={t('time')}>
                      {(availability?.services ?? servicesFor(date ?? today ?? '2026-01-01').map((s) => ({ id: s.id, slots: [] }))).map((s) => {
                        const count = s.slots.filter(bookable).length;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={service === s.id}
                            onClick={() => setService(s.id)}
                            className={cn(
                              'relative -mb-px cursor-pointer pb-3 text-left transition-colors',
                              service === s.id ? 'text-gold' : 'text-ivory/70 hover:text-ivory',
                            )}
                          >
                            <span className="font-display text-xl">{t(`services.${s.id}`)}</span>
                            {availability && (
                              <span className="ml-2 text-[0.65rem] tracking-[0.15em] text-mist uppercase">
                                {t('slotsCount', { count })}
                              </span>
                            )}
                            {service === s.id && (
                              <motion.span layoutId={`${uid}-service`} className="absolute inset-x-0 bottom-0 h-px bg-gold" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div role="tabpanel" aria-busy={loading} className="min-h-[7.5rem]">
                      {loadError ? (
                        <p className="flex flex-wrap items-center gap-4 text-sm text-mist">
                          {t('availabilityError')}
                          <button type="button" onClick={() => setRefresh((n) => n + 1)} className="link-gold cursor-pointer">
                            {t('retry')}
                          </button>
                        </p>
                      ) : !availability || loading ? (
                        <>
                          <p role="status" className="sr-only">
                            {t('loadingSlots')}
                          </p>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" aria-hidden="true">
                            {Array.from({ length: 6 }, (_, i) => (
                              <span key={i} className="h-14 animate-shimmer bg-ivory/5" />
                            ))}
                          </div>
                        </>
                      ) : availability.closed ? (
                        <p className="text-sm text-mist">{t('closedDay')}</p>
                      ) : currentService && currentService.slots.some(bookable) ? (
                        <motion.ul
                          key={`${date}-${service}-${guests}`}
                          initial="hidden"
                          animate="show"
                          variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.03 } } }}
                          className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
                        >
                          {currentService.slots.map((s) => {
                            const selected = slot?.service === service && slot.time === s.time;
                            const ok = bookable(s);
                            return (
                              <motion.li key={s.time} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                                <button
                                  type="button"
                                  disabled={!ok}
                                  aria-pressed={selected}
                                  onClick={() => {
                                    setSlot({ service, time: s.time });
                                    setFailure(null);
                                  }}
                                  className={cn(
                                    'flex h-14 w-full cursor-pointer flex-col items-center justify-center border text-sm tabular-nums transition-colors duration-300 disabled:cursor-not-allowed',
                                    selected
                                      ? 'border-gold bg-gold text-ink'
                                      : ok
                                        ? 'border-ivory/15 text-ivory hover:border-gold/60 hover:text-gold'
                                        : 'border-ivory/5 text-ivory/30',
                                  )}
                                >
                                  <span className={cn(s.status === 'full' && 'line-through')}>{formatTime(locale, s.time)}</span>
                                  {s.status === 'limited' && (
                                    <span className={cn('text-[0.58rem] tracking-[0.1em] uppercase', selected ? 'text-ink/75' : 'text-gold')}>
                                      {t('slotLimited')}
                                    </span>
                                  )}
                                  {s.status === 'full' && <span className="text-[0.58rem] tracking-[0.1em] uppercase">{t('slotFull')}</span>}
                                </button>
                              </motion.li>
                            );
                          })}
                        </motion.ul>
                      ) : (
                        <p className="text-sm text-mist">{t('noSlots', { count: guests })}</p>
                      )}
                    </div>
                  </fieldset>

                  <div className="flex flex-col-reverse gap-4 border-t border-ivory/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-mist" aria-live="polite">
                      {slot && date
                        ? `${formatDateLong(locale, date)} · ${formatTime(locale, slot.time)} · ${t('guestsValue', { count: guests })}`
                        : t('selectSlot')}
                    </p>
                    <button
                      type="button"
                      disabled={!slot}
                      onClick={() => {
                        setFailure(null);
                        setStep('details');
                      }}
                      className="btn btn-gold w-full sm:w-auto"
                    >
                      {t('next')} <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === 'details' && slot && date && (
            <motion.form
              key="details"
              noValidate
              onSubmit={submit}
              initial={{ opacity: 0, x: reduce ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduce ? 0 : 24 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="space-y-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border border-gold/20 bg-gold/[0.05] px-5 py-4">
                <div>
                  <p className="label">{t('summary')}</p>
                  <p className="mt-1 font-display text-xl first-letter:uppercase">
                    {t('summaryLine', { date: formatDateLong(locale, date), time: formatTime(locale, slot.time) })} ·{' '}
                    {t('guestsValue', { count: guests })}
                  </p>
                </div>
                <button type="button" onClick={() => setStep('table')} className="link-gold cursor-pointer text-xs tracking-[0.2em] uppercase">
                  {t('edit')}
                </button>
              </div>

              <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <TextField id={`${uid}-firstName`} label={t('firstName')} autoComplete="given-name" value={details.firstName} error={errorFor('firstName')} onChange={(v) => update('firstName', v)} onBlur={() => setTouched((x) => ({ ...x, firstName: true }))} maxLength={60} />
                <TextField id={`${uid}-lastName`} label={t('lastName')} autoComplete="family-name" value={details.lastName} error={errorFor('lastName')} onChange={(v) => update('lastName', v)} onBlur={() => setTouched((x) => ({ ...x, lastName: true }))} maxLength={60} />
                <TextField id={`${uid}-email`} type="email" inputMode="email" label={t('email')} autoComplete="email" value={details.email} error={errorFor('email')} onChange={(v) => update('email', v)} onBlur={() => setTouched((x) => ({ ...x, email: true }))} maxLength={254} />
                <TextField id={`${uid}-phone`} type="tel" inputMode="tel" label={t('phone')} hint={t('phoneHint')} autoComplete="tel" value={details.phone} error={errorFor('phone')} onChange={(v) => update('phone', v)} onBlur={() => setTouched((x) => ({ ...x, phone: true }))} maxLength={32} />
              </div>

              <fieldset>
                <legend className="label mb-3">{t('occasion')}</legend>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={details.occasion === o}
                      onClick={() => update('occasion', details.occasion === o ? undefined : o)}
                      className={cn(
                        'min-h-10 cursor-pointer border px-4 text-xs tracking-[0.08em] transition-colors duration-300',
                        details.occasion === o ? 'border-gold bg-gold text-ink' : 'border-ivory/15 text-ivory/80 hover:border-gold/60',
                      )}
                    >
                      {t(`occasions.${o}`)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor={`${uid}-requests`} className="label">
                  {t('requests')}
                </label>
                <textarea
                  id={`${uid}-requests`}
                  rows={3}
                  maxLength={REQUESTS_MAX}
                  value={details.requests}
                  placeholder={t('requestsPlaceholder')}
                  onChange={(e) => update('requests', e.target.value)}
                  aria-invalid={Boolean(errorFor('requests'))}
                  aria-describedby={`${uid}-requests-count`}
                  className="field resize-y"
                />
                <p id={`${uid}-requests-count`} className="mt-2 text-right text-xs text-mist tabular-nums">
                  {t('counter', { count: details.requests.length, max: REQUESTS_MAX })}
                </p>
              </div>

              {/* Champ piège pour les robots (invisible pour les humains et les lecteurs d'écran) */}
              <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
                <label htmlFor={`${uid}-website`}>{t('honeypot')}</label>
                <input id={`${uid}-website`} tabIndex={-1} autoComplete="off" value={details.website} onChange={(e) => update('website', e.target.value)} />
              </div>

              <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ivory/85">
                  <input
                    id={`${uid}-consent`}
                    type="checkbox"
                    checked={details.consent}
                    onChange={(e) => {
                      update('consent', e.target.checked);
                      setTouched((x) => ({ ...x, consent: true }));
                    }}
                    aria-invalid={Boolean(errorFor('consent'))}
                    aria-describedby={errorFor('consent') ? `${uid}-consent-error` : undefined}
                    className="mt-1 size-4 shrink-0 cursor-pointer accent-gold"
                  />
                  <span>
                    {t.rich('consent', {
                      link: (chunks) => (
                        <Link href="/mentions-legales" className="link-gold" target="_blank">
                          {chunks}
                        </Link>
                      ),
                    })}
                  </span>
                </label>
                {errorFor('consent') && (
                  <p id={`${uid}-consent-error`} className="mt-2 text-xs text-danger">
                    {errorFor('consent')}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-4 border-t border-ivory/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setStep('table')} className="inline-flex cursor-pointer items-center gap-3 text-xs tracking-[0.2em] text-mist uppercase hover:text-ivory">
                  <ArrowLeft size={16} /> {t('back')}
                </button>
                <button type="submit" disabled={pending} className="btn btn-gold w-full sm:w-auto">
                  {pending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" aria-hidden="true" />
                      {t('submitting')}
                    </>
                  ) : (
                    <>
                      {t('submit')} <Check size={16} />
                    </>
                  )}
                </button>
              </div>
              {submitted && Object.keys(clientErrors).length > 0 && (
                <p className="text-sm text-danger" role="alert">
                  {t('errors.summary')}
                </p>
              )}
            </motion.form>
          )}

          {step === 'done' && success && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="text-center"
              role="status"
            >
              <svg viewBox="0 0 80 80" className="mx-auto size-20" aria-hidden="true">
                <motion.circle cx="40" cy="40" r="37" fill="none" stroke="#D4AF37" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: EASE }} />
                <motion.path d="M25 41l10 10 20-22" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.7, ease: EASE }} />
              </svg>
              <h3 className="title-md mt-6">{t('success.title', { name: success.firstName })}</h3>
              <p className="lead mt-3">{t('success.lead')}</p>

              <div className="mx-auto mt-8 max-w-md border border-gold/30 p-6">
                <p className="label">{t('success.reference')}</p>
                <div className="mt-2 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
                  <p className="font-logo text-2xl tracking-[0.14em] whitespace-nowrap text-gold sm:text-3xl">{success.reference}</p>
                  <button type="button" onClick={copyReference} className="cursor-pointer text-[0.65rem] tracking-[0.18em] text-mist uppercase hover:text-gold">
                    {copied ? t('copied') : t('copy')}
                  </button>
                </div>
                <div className="hairline my-5" />
                <p className="font-display text-xl first-letter:uppercase">
                  {t('summaryLine', { date: formatDateLong(locale, success.date), time: formatTime(locale, success.time) })}
                </p>
                <p className="mt-1 text-sm text-mist">
                  {t('guestsValue', { count: success.guests })} · {success.firstName} {success.lastName}
                </p>
              </div>
              <p className="mt-6 text-sm text-mist">{t('success.emailSent', { email: success.email })}</p>

              <div className="mx-auto mt-8 max-w-md border border-[#25D366]/30 bg-[#25D366]/[0.06] p-6 text-left">
                <p className="flex items-center gap-2 text-xs tracking-[0.2em] text-ivory uppercase">
                  <WhatsApp size={16} className="text-[#25D366]" /> {t('success.whatsappTitle')}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ivory/80">{t('success.whatsappText')}</p>
                <a href={success.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-5 w-full">
                  <WhatsApp size={16} /> {t('success.whatsappCta')}
                </a>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button type="button" onClick={downloadIcs} className="btn btn-outline w-full sm:w-auto">
                  <Calendar size={16} /> {t('success.calendar')}
                </button>
                <button type="button" onClick={reset} className="btn btn-ghost w-full sm:w-auto">
                  {t('success.another')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  hint,
  value,
  error,
  onChange,
  onBlur,
  type = 'text',
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'value' | 'type' | 'id'>) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="field"
        required
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-2 text-xs text-mist">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
