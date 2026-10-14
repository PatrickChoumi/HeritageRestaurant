// 404 des adresses qui ne correspondent à aucune page (hors langues), autonome car sans layout.
import type { Metadata } from 'next';
import Link from 'next/link';
import { fontVariables } from './fonts';
import { Monogram } from '@/components/brand/Logo';
import './globals.css';

export const metadata: Metadata = { title: 'Page introuvable · Héritage', robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={fontVariables}>
      <body className="grid min-h-dvh place-items-center bg-ink px-4 text-center">
        <main className="flex flex-col items-center">
          <Monogram className="size-16" />
          <p className="kicker mt-10 justify-center">Erreur 404 · Error 404</p>
          <h1 className="title-lg mt-6">
            Page introuvable
            <br />
            <em>Page not found</em>
          </h1>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/" className="btn btn-gold">
              Retour à l’accueil
            </Link>
            <Link href="/en" className="btn btn-ghost">
              Back to home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
