import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from '@/components/icons';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { rich } from '@/components/ui/rich';
import { SignatureCarousel } from './SignatureCarousel';
import { getSignatureDishes } from '@/lib/menu';
import { formatPrice } from '@/lib/format';

/** Aperçu de la carte : plats signatures lus en base (SQL), dans la langue du visiteur. */
export async function Signatures() {
  const locale = (await getLocale()) as 'fr' | 'en';
  const t = await getTranslations('Signatures');
  let dishes: Awaited<ReturnType<typeof getSignatureDishes>> = [];
  try {
    dishes = await getSignatureDishes(locale, 8);
  } catch (error) {
    console.error('[héritage] Lecture des signatures impossible :', error);
  }
  if (dishes.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-gold/10 bg-coal py-28 md:py-36">
      <div className="container-luxe flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <SectionHeading kicker={t('kicker')} title={t.rich('title', rich)} intro={t('intro')} />
        <Link
          href="/la-carte"
          className="group inline-flex shrink-0 items-center gap-4 text-xs tracking-[0.25em] text-gold uppercase"
        >
          <span className="link-gold">{t('cta')}</span>
          <ArrowRight size={18} className="transition-transform duration-500 group-hover:translate-x-1.5" />
        </Link>
      </div>
      <SignatureCarousel
        dishes={dishes.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          price: formatPrice(locale, d.price),
          image: d.image!,
          available: d.isAvailable,
        }))}
      />
    </section>
  );
}
