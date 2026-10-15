'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { resendNotifications } from '@/app/admin/actions';

export function ResendButton({ id }: { id: number }) {
  const router = useRouter();
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await resendNotifications(id);
            setResult(r.ok ? 'E-mails renvoyés ✓' : `Échec : ${r.error ?? 'erreur inconnue'}`);
            router.refresh();
          })
        }
        className="min-h-9 cursor-pointer border border-ivory/20 px-3 text-xs hover:border-gold hover:text-gold disabled:opacity-50"
      >
        {pending ? 'Envoi…' : 'Renvoyer les e-mails'}
      </button>
      {result && (
        <span role="status" className="text-xs text-mist">
          {result}
        </span>
      )}
    </div>
  );
}
