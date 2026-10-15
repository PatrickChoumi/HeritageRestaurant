import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { fontVariables } from '../fonts';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { IntroCurtain, introScript } from '@/components/layout/IntroCurtain';
import { MotionProvider } from '@/components/layout/MotionProvider';
import { restaurant } from '@/lib/restaurant';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as 'fr', namespace: 'Meta' });
  return {
    metadataBase: new URL(restaurant.siteUrl),
    title: { default: t('homeTitle'), template: t('titleTemplate') },
    description: t('description'),
    applicationName: restaurant.name,
    formatDetection: { telephone: false },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
  colorScheme: 'dark',
};

// Espaces de traduction utilisés par les composants navigateur (les autres restent côté serveur)
const CLIENT_NAMESPACES = [
  'Nav',
  'Hero',
  'Signatures',
  'Ambiance',
  'Booking',
  'Footer',
  'Map',
  'Days',
  'DaysLower',
  'Menu',
  'Allergens',
  'Tags',
  'Contact',
  'Error',
] as const;

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]));
  const nav = await getTranslations('Nav');
  const intro = await getTranslations('Intro');

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col">
        <IntroCurtain label={intro('loading')} />
        <a
          href="#contenu"
          className="sr-only z-[110] bg-gold px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {nav('skip')}
        </a>
        <NextIntlClientProvider messages={clientMessages}>
          <MotionProvider>
            <SiteHeader />
            <main id="contenu" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
