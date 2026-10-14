import type { Metadata, Viewport } from 'next';
import { fontVariables } from '../fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'Administration', template: '%s · Administration Héritage' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0D0D0D', colorScheme: 'dark' };

/** Layout racine de l'administration (en français, jamais indexée). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={fontVariables}>
      <body className="min-h-dvh bg-ink text-ivory antialiased">{children}</body>
    </html>
  );
}
