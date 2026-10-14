import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/Logo';
import { Facebook, Instagram, Mail, MapPin, Phone, TikTok, WhatsApp } from '@/components/icons';
import { Marquee } from './Marquee';
import { MapEmbed } from './MapEmbed';
import { OpenStatus } from './OpenStatus';
import { NAV_ITEMS } from './nav-items';
import { googleMapsUrl, restaurant, whatsappUrl } from '@/lib/restaurant';
import { formatTime } from '@/lib/format';

export async function SiteFooter() {
  const locale = (await getLocale()) as 'fr' | 'en';
  const t = await getTranslations('Footer');
  const nav = await getTranslations('Nav');
  const days = await getTranslations('Days');

  const socials = [
    { href: restaurant.social.instagram, label: 'Instagram', Icon: Instagram },
    { href: restaurant.social.facebook, label: 'Facebook', Icon: Facebook },
    { href: restaurant.social.tiktok, label: 'TikTok', Icon: TikTok },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <footer className="relative mt-auto bg-ink">
      <Marquee label={t('marquee')} />

      <div className="container-luxe grid gap-14 py-20 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-6 lg:col-span-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-mist">{t('tagline')}</p>
          <OpenStatus className="text-ivory/80" />
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-11 place-items-center border border-ivory/15 text-ivory/80 transition-colors hover:border-gold hover:text-gold"
              aria-label="WhatsApp"
            >
              <WhatsApp size={18} />
            </a>
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-11 place-items-center border border-ivory/15 text-ivory/80 transition-colors hover:border-gold hover:text-gold"
                aria-label={label}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h2 className="kicker mb-6">{t('hours')}</h2>
          <table className="w-full text-sm">
            <caption className="sr-only">{t('hours')}</caption>
            <tbody>
              {restaurant.openingHours.map((h) => (
                <tr key={h.day} className="border-b border-ivory/[0.07] last:border-0">
                  <th scope="row" className="py-2.5 pr-4 text-left font-normal text-ivory/85">
                    {days(String(h.day) as '0')}
                    {h.day === restaurant.karaokeDay && (
                      <span className="ml-2 text-[0.65rem] tracking-[0.18em] text-gold uppercase">{t('karaoke')}</span>
                    )}
                  </th>
                  <td className="py-2.5 text-right text-mist tabular-nums">
                    {formatTime(locale, h.opens)} – {formatTime(locale, h.closes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <div>
            <h2 className="kicker mb-6">{t('address')}</h2>
            <address className="space-y-1 text-sm leading-relaxed text-ivory/85 not-italic">
              <span className="flex gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-gold" />
                <span>
                  {restaurant.address.street}
                  <br />
                  {restaurant.address.locality}, {restaurant.address.countryName[locale]}
                </span>
              </span>
            </address>
            <a href={googleMapsUrl()} target="_blank" rel="noopener noreferrer" className="link-gold mt-3 inline-block text-xs tracking-[0.18em] uppercase">
              {t('directions')} ↗
            </a>
          </div>
          <div>
            <h2 className="kicker mb-6">{t('contact')}</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`tel:${restaurant.phone.e164}`} className="flex items-center gap-3 text-ivory/85 hover:text-gold">
                  <Phone size={18} className="text-gold" />
                  {restaurant.phone.display}
                </a>
              </li>
              <li>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-ivory/85 hover:text-gold">
                  <WhatsApp size={18} className="text-gold" />
                  {t('whatsapp')}
                </a>
              </li>
              {restaurant.publicEmail && (
                <li>
                  <a href={`mailto:${restaurant.publicEmail}`} className="flex items-center gap-3 break-all text-ivory/85 hover:text-gold">
                    <Mail size={18} className="shrink-0 text-gold" />
                    {restaurant.publicEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <MapEmbed className="aspect-[4/3] w-full lg:aspect-auto lg:h-full lg:min-h-72" />
        </div>
      </div>

      <div className="border-t border-ivory/[0.07]">
        <div className="container-luxe flex flex-col gap-4 py-8 text-xs text-mist md:flex-row md:items-center md:justify-between">
          <nav aria-label={nav('primary')}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-ivory">
                    {nav(item.key)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/mentions-legales" className="hover:text-ivory">
                  {t('legal')}
                </Link>
              </li>
            </ul>
          </nav>
          <p className="flex flex-col gap-1 md:items-end">
            <span>{t('rights', { year: new Date().getFullYear() })}</span>
            <span>{t('credits')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
