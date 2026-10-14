import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Monogram } from '@/components/brand/Logo';
import { rich } from '@/components/ui/rich';

export default async function NotFound() {
  const t = await getTranslations('NotFound');
  return (
    <section className="container-luxe flex min-h-[80svh] flex-col items-center justify-center pt-32 pb-20 text-center">
      <Monogram className="size-16 opacity-80" />
      <p className="kicker mt-10 justify-center">{t('kicker')}</p>
      <h1 className="title-lg mt-6 max-w-2xl">{t.rich('title', rich)}</h1>
      <p className="lead mt-6 max-w-md">{t('text')}</p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link href="/" className="btn btn-gold">
          {t('home')}
        </Link>
        <Link href="/la-carte" className="btn btn-ghost">
          {t('menu')}
        </Link>
      </div>
    </section>
  );
}
