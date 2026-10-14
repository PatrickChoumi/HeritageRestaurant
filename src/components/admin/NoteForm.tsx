'use client';

import { useState, useTransition } from 'react';
import { saveInternalNote } from '@/app/admin/actions';

export function NoteForm({ id, initial }: { id: number; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await saveInternalNote(id, value);
          setSaved(true);
        });
      }}
    >
      <label htmlFor={`note-${id}`} className="label">
        Note interne (visible seulement par l’équipe)
      </label>
      <textarea
        id={`note-${id}`}
        rows={3}
        maxLength={1000}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="Table 12, client fidèle, prévoir un gâteau…"
        className="field resize-y text-sm"
      />
      <div className="mt-2 flex items-center gap-3">
        <button type="submit" disabled={pending} className="min-h-9 cursor-pointer border border-ivory/20 px-3 text-xs hover:border-gold hover:text-gold disabled:opacity-50">
          {pending ? 'Enregistrement…' : 'Enregistrer la note'}
        </button>
        {saved && <span className="text-xs text-success">Enregistrée ✓</span>}
      </div>
    </form>
  );
}
