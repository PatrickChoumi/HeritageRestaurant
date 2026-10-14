'use client';

import { useActionState } from 'react';
import { changePasswordAction, type PasswordState } from '@/app/admin/actions';

const ERRORS = {
  current: 'Mot de passe actuel incorrect.',
  tooShort: 'Le nouveau mot de passe doit contenir au moins 12 caractères.',
  mismatch: 'Les deux nouveaux mots de passe ne correspondent pas.',
  same: 'Choisissez un mot de passe différent de l’actuel.',
};

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="max-w-md space-y-6">
      {[
        { name: 'current', label: 'Mot de passe actuel', autoComplete: 'current-password' },
        { name: 'next', label: 'Nouveau mot de passe (12 caractères minimum)', autoComplete: 'new-password' },
        { name: 'confirm', label: 'Confirmer le nouveau mot de passe', autoComplete: 'new-password' },
      ].map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="label">
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type="password"
            required
            autoComplete={f.autoComplete}
            minLength={f.name === 'current' ? undefined : 12}
            className="field"
          />
        </div>
      ))}
      {state.error && (
        <p role="alert" className="border-l-2 border-danger bg-danger/10 px-4 py-3 text-sm">
          {ERRORS[state.error]}
        </p>
      )}
      {state.ok && (
        <p role="status" className="border-l-2 border-success bg-success/10 px-4 py-3 text-sm">
          Mot de passe modifié ✓ Les autres sessions ont été fermées.
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-gold">
        {pending ? 'Enregistrement…' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}
