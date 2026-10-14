import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { LoginForm } from '@/components/admin/LoginForm';
import { getSession } from '@/lib/auth/session';
import { usesEmbeddedDatabase } from '@/lib/db/client';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  if (await getSession()) redirect('/admin');
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex justify-center">
          <Logo />
        </div>
        <div className="border border-gold/20 bg-coal p-8 sm:p-10">
          <h1 className="title-md">Administration</h1>
          <p className="mt-2 mb-8 text-sm text-mist">Réservations, carte et messages du restaurant.</p>
          <LoginForm next={typeof next === 'string' ? next : undefined} />
        </div>
        {usesEmbeddedDatabase() && (
          <p className="mt-6 text-center text-xs leading-relaxed text-mist">
            Base locale de démonstration : l’identifiant et le mot de passe ont été affichés dans le terminal au premier
            démarrage (<code className="text-gold">npm run dev</code>).
          </p>
        )}
      </div>
    </main>
  );
}
