import type { Metadata } from 'next';
import { setMessageRead } from '@/app/admin/actions';
import { SubmitButton } from '@/components/admin/FormButtons';
import { Mail, Phone, WhatsApp } from '@/components/icons';
import { requireAdmin } from '@/lib/auth/session';
import { listMessages } from '@/lib/admin/queries';
import { formatPhone } from '@/lib/reservations/validation';
import { whatsappUrl } from '@/lib/restaurant';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Messages' };

const SUBJECTS: Record<string, string> = {
  info: 'Renseignement',
  group: 'Groupe ou privatisation',
  event: 'Événement',
  press: 'Presse & partenariats',
  other: 'Autre',
};

export default async function MessagesPage() {
  await requireAdmin();
  const messages = await listMessages();
  const date = (d: Date) =>
    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Douala' }).format(d);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="title-md">Messages</h1>
      <p className="mt-1 text-sm text-mist">Demandes envoyées depuis la page Contact.</p>
      {messages.length === 0 ? (
        <p className="mt-10 border border-dashed border-ivory/15 p-10 text-center text-sm text-mist">
          Aucun message pour le moment.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {messages.map((m) => (
            <li key={m.id} className={cn('border bg-coal p-5 md:p-6', m.readAt ? 'border-ivory/10' : 'border-gold/40')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-ivory">
                    {!m.readAt && (
                      <span className="mr-2 inline-block size-2 rounded-full bg-gold" aria-label="Non lu" />
                    )}
                    {m.name} <span className="text-sm text-mist">· {SUBJECTS[m.subject] ?? m.subject}</span>
                  </p>
                  <p className="text-xs text-mist">
                    {date(m.createdAt)} · {m.locale === 'fr' ? 'français' : 'anglais'}
                  </p>
                </div>
                <form action={setMessageRead.bind(null, m.id, !m.readAt)}>
                  <SubmitButton className="min-h-9 border border-ivory/15 px-3 text-xs text-ivory/80 hover:border-gold hover:text-gold">
                    {m.readAt ? 'Marquer non lu' : 'Marquer comme lu'}
                  </SubmitButton>
                </form>
              </div>
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-ivory/90">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent('Votre message à Héritage')}`}
                  className="flex items-center gap-2 text-gold hover:text-gold-light"
                >
                  <Mail size={14} /> {m.email}
                </a>
                {m.phone && (
                  <>
                    <a href={`tel:${m.phone}`} className="flex items-center gap-2 text-gold hover:text-gold-light">
                      <Phone size={14} /> {formatPhone(m.phone)}
                    </a>
                    <a
                      href={whatsappUrl(
                        `Bonjour ${m.name}, ici Héritage, suite à votre message :`,
                        m.phone.replace(/\D/g, ''),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gold hover:text-gold-light"
                    >
                      <WhatsApp size={14} /> WhatsApp
                    </a>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
