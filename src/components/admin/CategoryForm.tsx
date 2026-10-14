'use client';

import { useActionState } from 'react';
import { saveCategoryAction, type CategoryFormState } from '@/app/admin/actions';
import type { AdminCategory } from '@/lib/admin/queries';

export function CategoryForm({ category }: { category: Pick<AdminCategory, 'id' | 'fr' | 'en'> }) {
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(saveCategoryAction, {});
  return (
    <form action={action} className="mt-4 grid gap-5 border border-ivory/10 bg-coal p-5 md:grid-cols-2">
      <input type="hidden" name="id" value={category.id} />
      {(['fr', 'en'] as const).map((l) => (
        <fieldset key={l} className="space-y-4">
          <legend className="label mb-2 text-gold">{l === 'fr' ? 'Français' : 'English'}</legend>
          <div>
            <label className="label" htmlFor={`c${category.id}-name-${l}`}>
              Nom
            </label>
            <input id={`c${category.id}-name-${l}`} name={l === 'fr' ? 'nameFr' : 'nameEn'} defaultValue={category[l].name} required maxLength={80} className="field text-sm" />
          </div>
          <div>
            <label className="label" htmlFor={`c${category.id}-desc-${l}`}>
              Description
            </label>
            <textarea id={`c${category.id}-desc-${l}`} name={l === 'fr' ? 'descriptionFr' : 'descriptionEn'} defaultValue={category[l].description} rows={2} maxLength={300} className="field resize-y text-sm" />
          </div>
        </fieldset>
      ))}
      <div className="flex items-center gap-3 md:col-span-2">
        <button type="submit" disabled={pending} className="min-h-9 cursor-pointer border border-gold/60 px-4 text-xs text-gold hover:bg-gold hover:text-ink disabled:opacity-50">
          {pending ? 'Enregistrement…' : 'Enregistrer la catégorie'}
        </button>
        {state.ok && <span className="text-xs text-success">Enregistrée ✓</span>}
        {state.error && <span className="text-xs text-danger">Noms obligatoires (2 caractères minimum).</span>}
      </div>
    </form>
  );
}
