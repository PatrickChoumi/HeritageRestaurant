'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';
import { submitContact } from '@/app/actions/contact';
import { Check } from '@/components/icons';
import { cn } from '@/lib/cn';

const SUBJECTS = ['info', 'group', 'event', 'press', 'other'] as const;
type Values = {
  name: string;
  email: string;
  phone: string;
  subject: (typeof SUBJECTS)[number];
  message: string;
  website: string;
};

export function ContactForm() {
  const t = useTranslations('Contact.form');
  const locale = useLocale();
  const uid = useId();
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    phone: '',
    subject: 'info',
    message: '',
    website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<'rateLimited' | 'server' | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFailure(null);
    startTransition(async () => {
      try {
        const result = await submitContact({ ...values, phone: values.phone || undefined, locale });
        if (result.ok) {
          setSent(true);
          return;
        }
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
          const first = Object.keys(result.fieldErrors)[0];
          if (first) document.getElementById(`${uid}-${first}`)?.focus();
        }
        if (result.error) setFailure(result.error);
      } catch {
        setFailure('server');
      }
    });
  };

  const message = (key: string) => {
    const code = errors[key];
    if (!code) return undefined;
    return t(
      `errors.${(['required', 'invalid', 'tooShort', 'tooLong'] as const).find((c) => c === code) ?? 'invalid'}`,
    );
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <motion.div
          key="sent"
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 border border-gold/30 bg-gold/[0.05] p-6"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-ink">
            <Check size={18} strokeWidth={2.2} />
          </span>
          <p className="leading-relaxed text-ivory/90">{t('success')}</p>
        </motion.div>
      ) : (
        <motion.form key="form" noValidate onSubmit={submit} exit={{ opacity: 0 }} className="space-y-7">
          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {(['name', 'email', 'phone'] as const).map((key) => (
              <div key={key} className={cn(key === 'name' && 'sm:col-span-2')}>
                <label htmlFor={`${uid}-${key}`} className="label">
                  {t(key)}
                </label>
                <input
                  id={`${uid}-${key}`}
                  type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                  autoComplete={key === 'phone' ? 'tel' : key}
                  value={values[key]}
                  onChange={(e) => set(key, e.target.value)}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `${uid}-${key}-error` : undefined}
                  required={key !== 'phone'}
                  className="field"
                />
                {message(key) && (
                  <p id={`${uid}-${key}-error`} className="mt-2 text-xs text-danger">
                    {message(key)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div>
            <label htmlFor={`${uid}-subject`} className="label">
              {t('subject')}
            </label>
            <select
              id={`${uid}-subject`}
              value={values.subject}
              onChange={(e) => set('subject', e.target.value as Values['subject'])}
              className="field cursor-pointer bg-coal"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {t(`subjects.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-message`} className="label">
              {t('message')}
            </label>
            <textarea
              id={`${uid}-message`}
              rows={5}
              maxLength={2000}
              value={values.message}
              onChange={(e) => set('message', e.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${uid}-message-error` : undefined}
              required
              className="field resize-y"
            />
            {message('message') && (
              <p id={`${uid}-message-error`} className="mt-2 text-xs text-danger">
                {message('message')}
              </p>
            )}
          </div>
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <input
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => set('website', e.target.value)}
            />
          </div>
          {failure && (
            <p role="alert" className="border-l-2 border-danger bg-danger/10 px-4 py-3 text-sm">
              {t(`errors.${failure}`)}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn btn-gold w-full sm:w-auto">
            {pending ? t('sending') : t('submit')}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
