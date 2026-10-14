'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/app/admin/actions';

const MESSAGES = {
  invalid: 'Identifiant ou mot de passe incorrect.',
  rateLimited: 'Trop de tentatives. Patientez 15 minutes avant de réessayer.',
};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-7">
      <input type="hidden" name="next" value={next ?? ''} />
      <div>
        <label htmlFor="email" className="label">
          E-mail
        </label>
        <input
          key={state.email ?? ''}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="field"
          autoFocus={!state.email}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
          autoFocus={Boolean(state.email)}
        />
      </div>
      {state.error && (
        <p role="alert" className="border-l-2 border-danger bg-danger/10 px-4 py-3 text-sm">
          {MESSAGES[state.error]}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-gold w-full">
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
