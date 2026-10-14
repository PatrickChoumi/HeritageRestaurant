import { AdminNav } from '@/components/admin/AdminNav';
import { requireAdmin } from '@/lib/auth/session';
import { navCounts } from '@/lib/admin/queries';
import { usesEmbeddedDatabase } from '@/lib/db/client';

/** Coque de l'administration : accessible uniquement avec une session valide. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const counts = await navCounts();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AdminNav user={session.user} counts={counts} demo={usesEmbeddedDatabase()} />
      <main className="min-w-0 px-4 py-8 sm:px-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
