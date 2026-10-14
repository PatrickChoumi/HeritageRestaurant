'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Monogram } from '@/components/brand/Logo';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Error');
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="container-luxe flex min-h-[80svh] flex-col items-center justify-center pt-32 pb-20 text-center">
      <Monogram className="size-16 opacity-80" />
      <h1 className="title-lg mt-10">{t('title')}</h1>
      <p className="lead mt-6 max-w-md">{t('text')}</p>
      <button type="button" onClick={reset} className="btn btn-gold mt-10">
        {t('retry')}
      </button>
    </section>
  );
}
