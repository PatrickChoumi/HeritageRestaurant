'use client';

import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/cn';

/** Bouton d'envoi qui se désactive pendant l'action serveur. */
export function SubmitButton({
  children,
  className,
  confirm,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn('cursor-pointer disabled:cursor-wait disabled:opacity-50', className)}
      {...props}
    >
      {children}
    </button>
  );
}
