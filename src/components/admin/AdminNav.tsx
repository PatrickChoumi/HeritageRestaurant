'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logoutAction } from '@/app/admin/actions';
import { Logo } from '@/components/brand/Logo';
import { ArrowUpRight, Calendar, Close, Mail, Sparkle, Users, Wine } from '@/components/icons';
import { cn } from '@/lib/cn';

const ITEMS = [
  { href: '/admin', label: 'Tableau de bord', Icon: Sparkle, badge: null },
  { href: '/admin/reservations', label: 'Réservations', Icon: Calendar, badge: 'pending' },
  { href: '/admin/carte', label: 'La carte', Icon: Wine, badge: null },
  { href: '/admin/messages', label: 'Messages', Icon: Mail, badge: 'unread' },
  { href: '/admin/compte', label: 'Mon compte', Icon: Users, badge: null },
] as const;

export function AdminNav({
  user,
  counts,
  demo,
}: {
  user: { name: string; email: string };
  counts: { pending: number; unread: number };
  demo: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Administration" className="flex flex-1 flex-col gap-1">
      {ITEMS.map(({ href, label, Icon, badge }) => {
        const n = badge ? counts[badge] : 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 border-l-2 px-4 text-sm transition-colors',
              active(href) ? 'border-gold bg-gold/[0.07] text-gold' : 'border-transparent text-ivory/75 hover:bg-ivory/[0.04] hover:text-ivory',
            )}
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {n > 0 && (
              <span className="grid min-w-6 place-items-center rounded-full bg-gold px-1.5 text-[0.68rem] font-medium text-ink tabular-nums">
                {n}
              </span>
            )}
          </Link>
        );
      })}
      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="mt-4 flex min-h-11 items-center gap-3 border-l-2 border-transparent px-4 text-sm text-ivory/60 hover:text-ivory"
      >
        <ArrowUpRight size={17} /> Voir le site
      </a>
    </nav>
  );

  const footer = (
    <div className="border-t border-ivory/10 p-4">
      <p className="truncate text-sm text-ivory">{user.name}</p>
      <p className="truncate text-xs text-mist">{user.email}</p>
      <form action={logoutAction} className="mt-3">
        <button type="submit" className="cursor-pointer text-xs tracking-[0.16em] text-gold uppercase hover:text-gold-light">
          Se déconnecter
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Barre latérale (ordinateur) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-ivory/10 bg-coal lg:flex">
        <div className="px-5 pt-7 pb-8">
          <Logo compact />
          {demo && <p className="mt-4 inline-block border border-gold/30 px-2 py-1 text-[0.62rem] tracking-[0.16em] text-gold uppercase">Démo · base locale</p>}
        </div>
        {nav}
        {footer}
      </aside>

      {/* Barre supérieure (téléphone, tablette) */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ivory/10 bg-coal/95 px-4 backdrop-blur lg:hidden">
        <Logo compact />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="relative grid size-11 cursor-pointer place-items-center text-gold"
          aria-label="Ouvrir le menu"
        >
          <span className="block h-px w-6 bg-gold shadow-[0_6px_0_var(--color-gold),0_-6px_0_var(--color-gold)]" />
          {counts.pending + counts.unread > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-gold" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="admin-drawer">
          <button type="button" className="absolute inset-0 bg-ink/70" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-coal">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo compact />
              <button type="button" onClick={() => setOpen(false)} className="grid size-11 cursor-pointer place-items-center text-gold" aria-label="Fermer le menu">
                <Close size={18} />
              </button>
            </div>
            {nav}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
