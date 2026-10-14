import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { deleteDish, moveDish, toggleDish } from '@/app/admin/actions';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { SubmitButton } from '@/components/admin/FormButtons';
import { Plus } from '@/components/icons';
import { requireAdmin } from '@/lib/auth/session';
import { adminMenu } from '@/lib/admin/queries';
import { imageFor } from '@/lib/images';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'La carte' };

export default async function AdminMenuPage({ searchParams }: PageProps<'/admin/carte'>) {
  await requireAdmin();
  const menu = await adminMenu();
  const { saved } = await searchParams;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="title-md">La carte</h1>
          <p className="mt-1 text-sm text-mist">Chaque modification est visible immédiatement sur le site, en français et en anglais.</p>
        </div>
        <Link href="/admin/carte/nouveau" className="btn btn-gold min-h-10 px-4 py-2">
          <Plus size={16} /> Ajouter un plat
        </Link>
      </header>
      {saved && (
        <p role="status" className="mt-6 border-l-2 border-success bg-success/10 px-4 py-3 text-sm">
          Plat enregistré ✓ Le site public est à jour.
        </p>
      )}

      <div className="mt-10 space-y-12">
        {menu.map((category) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-gold/20 pb-3">
              <h2 id={`cat-${category.id}`} className="font-display text-2xl">
                {category.fr.name} <span className="text-base text-mist">/ {category.en.name}</span>
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-mist">{category.dishes.length} plat(s)</span>
                <Link href={`/admin/carte/nouveau?categorie=${category.id}`} className="text-gold hover:text-gold-light">
                  + Ajouter ici
                </Link>
              </div>
            </div>
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-mist hover:text-ivory">Modifier le nom et la description de la catégorie</summary>
              <CategoryForm category={category} />
            </details>

            <ul className="mt-4 divide-y divide-ivory/[0.07]">
              {category.dishes.map((dish, i) => {
                const image = imageFor(dish.image);
                return (
                  <li key={dish.id} className={cn('flex flex-wrap items-center gap-4 py-4', !dish.isAvailable && 'opacity-70')}>
                    <div className="relative size-14 shrink-0 overflow-hidden bg-graphite">
                      {image ? <Image src={image} alt="" fill sizes="56px" className="object-cover" /> : <span className="grid size-full place-items-center text-xs text-mist">—</span>}
                    </div>
                    <div className="min-w-48 flex-1">
                      <Link href={`/admin/carte/${dish.id}`} className="text-ivory hover:text-gold">
                        {dish.fr.name}
                      </Link>
                      <p className="text-xs text-mist">{dish.en.name || <em className="text-danger not-italic">traduction anglaise manquante</em>}</p>
                    </div>
                    <p className="w-28 text-right font-display text-lg text-gold tabular-nums">{formatPrice('fr', dish.price)}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <form action={toggleDish.bind(null, dish.id, 'isAvailable')}>
                        <SubmitButton
                          aria-pressed={dish.isAvailable}
                          className={cn('min-h-9 border px-3', dish.isAvailable ? 'border-success/50 text-success' : 'border-danger/50 text-danger')}
                        >
                          {dish.isAvailable ? '✓ Disponible' : '✕ Épuisé'}
                        </SubmitButton>
                      </form>
                      <form action={toggleDish.bind(null, dish.id, 'isSignature')}>
                        <SubmitButton aria-pressed={dish.isSignature} className={cn('min-h-9 border px-3', dish.isSignature ? 'border-gold text-gold' : 'border-ivory/15 text-mist')}>
                          {dish.isSignature ? '✦ Signature' : '✧ Signature'}
                        </SubmitButton>
                      </form>
                      <form action={moveDish.bind(null, dish.id, -1)}>
                        <SubmitButton disabled={i === 0} aria-label={`Monter ${dish.fr.name}`} className="grid size-9 place-items-center border border-ivory/15 text-mist hover:text-ivory disabled:opacity-30">
                          ↑
                        </SubmitButton>
                      </form>
                      <form action={moveDish.bind(null, dish.id, 1)}>
                        <SubmitButton
                          disabled={i === category.dishes.length - 1}
                          aria-label={`Descendre ${dish.fr.name}`}
                          className="grid size-9 place-items-center border border-ivory/15 text-mist hover:text-ivory disabled:opacity-30"
                        >
                          ↓
                        </SubmitButton>
                      </form>
                      <Link href={`/admin/carte/${dish.id}`} className="grid min-h-9 place-items-center border border-ivory/15 px-3 text-ivory/85 hover:border-gold hover:text-gold">
                        Modifier
                      </Link>
                      <form action={deleteDish.bind(null, dish.id)}>
                        <SubmitButton confirm={`Supprimer définitivement « ${dish.fr.name} » ?`} className="min-h-9 border border-danger/30 px-3 text-danger hover:bg-danger/10">
                          Supprimer
                        </SubmitButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
