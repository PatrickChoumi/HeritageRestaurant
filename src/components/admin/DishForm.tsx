'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState } from 'react';
import { saveDishAction, type DishFormState } from '@/app/admin/actions';
import { ALLERGENS, TAGS } from '@/lib/menu-codes';
import { dishImageKeys, imageFor } from '@/lib/images';
import type { AdminDish } from '@/lib/admin/queries';
import { cn } from '@/lib/cn';

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten', crustaceans: 'Crustacés', eggs: 'Œufs', fish: 'Poisson', peanuts: 'Arachides', soy: 'Soja', milk: 'Lait',
  nuts: 'Fruits à coque', celery: 'Céleri', mustard: 'Moutarde', sesame: 'Sésame', sulphites: 'Sulfites', lupin: 'Lupin', molluscs: 'Mollusques',
};
const TAG_LABELS: Record<string, string> = {
  vegetarian: 'Végétarien', vegan: 'Vegan', spicy: 'Relevé', 'alcohol-free': 'Sans alcool', 'to-share': 'À partager', local: 'Terroir camerounais',
};

export function DishForm({
  dish,
  categories,
  defaultCategoryId,
}: {
  dish?: AdminDish;
  categories: { id: number; name: string }[];
  defaultCategoryId?: number;
}) {
  const [state, action, pending] = useActionState<DishFormState, FormData>(saveDishAction, {});
  const err = (k: keyof NonNullable<DishFormState['errors']>) => state.errors?.[k];

  return (
    <form action={action} className="space-y-10">
      {dish && <input type="hidden" name="id" value={dish.id} />}
      {state.errors && (
        <p role="alert" className="border-l-2 border-danger bg-danger/10 px-4 py-3 text-sm">
          Certains champs sont à corriger (nom français obligatoire, prix entier en FCFA).
        </p>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <label htmlFor="categoryId" className="label">
            Catégorie
          </label>
          <select id="categoryId" name="categoryId" defaultValue={dish?.categoryId ?? defaultCategoryId ?? categories[0]?.id} className="field cursor-pointer bg-coal">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="price" className="label">
            Prix (FCFA)
          </label>
          <input id="price" name="price" type="number" inputMode="numeric" min={0} step={100} required defaultValue={dish?.price ?? ''} aria-invalid={Boolean(err('price'))} className="field tabular-nums" />
        </div>
        <div className="flex items-end gap-6 pb-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="isAvailable" defaultChecked={dish?.isAvailable ?? true} className="size-4 accent-gold" /> Disponible
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="isSignature" defaultChecked={dish?.isSignature ?? false} className="size-4 accent-gold" /> Signature
          </label>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {(['fr', 'en'] as const).map((l) => (
          <fieldset key={l} className="space-y-6 border border-ivory/10 bg-coal p-6">
            <legend className="px-2 font-display text-xl text-gold">{l === 'fr' ? 'Français' : 'English (facultatif)'}</legend>
            <div>
              <label htmlFor={`name-${l}`} className="label">
                Nom du plat
              </label>
              <input
                id={`name-${l}`}
                name={l === 'fr' ? 'nameFr' : 'nameEn'}
                defaultValue={dish?.[l].name}
                required={l === 'fr'}
                maxLength={120}
                aria-invalid={Boolean(err(l === 'fr' ? 'nameFr' : 'nameEn'))}
                className="field"
              />
            </div>
            <div>
              <label htmlFor={`desc-${l}`} className="label">
                Description
              </label>
              <textarea id={`desc-${l}`} name={l === 'fr' ? 'descriptionFr' : 'descriptionEn'} defaultValue={dish?.[l].description} rows={3} maxLength={600} className="field resize-y" />
            </div>
            {l === 'en' && <p className="text-xs text-mist">Sans nom anglais, la version anglaise du site affiche le français.</p>}
          </fieldset>
        ))}
      </div>

      <fieldset>
        <legend className="label mb-4">Allergènes</legend>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <label key={a} className="cursor-pointer">
              <input type="checkbox" name="allergens" value={a} defaultChecked={dish?.allergens.includes(a)} className="peer sr-only" />
              <span className="inline-block border border-ivory/15 px-3 py-2 text-xs text-ivory/80 transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-gold">
                {ALLERGEN_LABELS[a]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-4">Spécificités</legend>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <label key={tag} className="cursor-pointer">
              <input type="checkbox" name="tags" value={tag} defaultChecked={dish?.tags.includes(tag)} className="peer sr-only" />
              <span className="inline-block border border-ivory/15 px-3 py-2 text-xs text-ivory/80 transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-gold">
                {TAG_LABELS[tag]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-4">Photo</legend>
        <div className="flex flex-wrap gap-3">
          {['', ...dishImageKeys].map((key) => {
            const img = imageFor(key);
            return (
              <label key={key || 'none'} className="cursor-pointer">
                <input type="radio" name="image" value={key} defaultChecked={(dish?.image ?? '') === key} className="peer sr-only" />
                <span className={cn('relative grid size-24 place-items-center overflow-hidden border-2 border-transparent bg-graphite text-xs text-mist peer-checked:border-gold peer-focus-visible:outline-2 peer-focus-visible:outline-gold')}>
                  {img ? <Image src={img} alt={key} fill sizes="96px" className="object-cover" /> : 'Sans photo'}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-mist">Les plats signatures avec photo apparaissent sur la page d’accueil.</p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-ivory/10 pt-8">
        <button type="submit" disabled={pending} className="btn btn-gold">
          {pending ? 'Enregistrement…' : dish ? 'Enregistrer les modifications' : 'Ajouter le plat'}
        </button>
        <Link href="/admin/carte" className="text-xs tracking-[0.16em] text-mist uppercase hover:text-ivory">
          Annuler
        </Link>
      </div>
    </form>
  );
}
