import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Check, Phone, WhatsApp } from '@/components/icons';
import { Reveal } from '@/components/ui/Reveal';
import { rich } from '@/components/ui/rich';
import { BookingForm } from './BookingForm';
import { images } from '@/lib/images';
import { restaurant, whatsappUrl } from '@/lib/restaurant';

const POLICY = ['hold', 'change', 'groups', 'friday'] as const;

/** Module de réservation : arguments et contact à gauche, formulaire à droite. */
export async function BookingSection({ headingLevel = 'h2' }: { headingLevel?: 'h1' | 'h2' }) {
  const t = await getTranslations('Booking');
  const Heading = headingLevel;

  return (
    <section id="reservation" className="relative isolate overflow-hidden py-28 md:py-36">
      <Image
        src={images['ambiance/table']}
        alt=""
        fill
        sizes="100vw"
        placeholder="blur"
        className="-z-20 object-cover opacity-25"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-ink/90 to-ink" aria-hidden="true" />

      <div className="container-luxe grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="kicker">{t('kicker')}</p>
            <Heading className="title-lg mt-6">{t.rich('title', rich)}</Heading>
            <p className="lead mt-6">{t('intro')}</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <h3 className="label mb-5 text-gold">{t('policyTitle')}</h3>
            <ul className="space-y-4">
              {POLICY.map((key) => (
                <li key={key} className="flex gap-4 text-sm leading-relaxed text-ivory/85">
                  <Check size={18} className="mt-0.5 shrink-0 text-gold" />
                  {t(`policy.${key}`)}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.2} className="mt-10 flex flex-wrap gap-3">
            <a href={`tel:${restaurant.phone.e164}`} className="btn btn-ghost min-h-11 px-5 py-2.5">
              <Phone size={16} /> {restaurant.phone.display}
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost min-h-11 px-5 py-2.5"
            >
              <WhatsApp size={16} /> WhatsApp
            </a>
          </Reveal>
        </div>
        <Reveal delay={0.15} className="min-w-0 lg:col-span-7">
          <BookingForm />
        </Reveal>
      </div>
    </section>
  );
}
