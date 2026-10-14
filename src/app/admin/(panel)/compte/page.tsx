import type { Metadata } from 'next';
import { PasswordForm } from '@/components/admin/PasswordForm';
import { requireAdmin } from '@/lib/auth/session';
import { emailMode } from '@/lib/email/send';
import { usesEmbeddedDatabase } from '@/lib/db/client';

export const metadata: Metadata = { title: 'Mon compte' };

const EMAIL_MODES = {
  resend: 'Resend (API)',
  smtp: 'Serveur SMTP',
  outbox: 'Développement : e-mails enregistrés dans .outbox/ (aucun envoi réel)',
};

export default async function AccountPage() {
  const session = await requireAdmin();
  const twilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_WHATSAPP_TO);
  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <div>
        <h1 className="title-md">Mon compte</h1>
        <p className="mt-1 text-sm text-mist">{session.user.email}</p>
      </div>
      <section>
        <h2 className="mb-6 font-display text-2xl">Mot de passe</h2>
        <PasswordForm />
      </section>
      <section>
        <h2 className="mb-6 font-display text-2xl">Configuration</h2>
        <dl className="divide-y divide-ivory/[0.07] border border-ivory/10 bg-coal text-sm">
          {[
            ['Base de données', usesEmbeddedDatabase() ? 'PGlite (base locale de démonstration)' : 'PostgreSQL'],
            ['E-mails', EMAIL_MODES[emailMode()]],
            ['Alerte WhatsApp automatique', twilio ? 'Twilio activé' : 'Non configurée (lien WhatsApp pré-rempli uniquement)'],
            ['Destinataire des alertes', process.env.RESTAURANT_EMAIL ?? 'restaurant@heritage.local (à définir : RESTAURANT_EMAIL)'],
            ['Confirmation automatique', process.env.RESERVATION_AUTO_CONFIRM === 'true' ? 'Oui' : 'Non (confirmation par l’équipe)'],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1 p-4 sm:grid-cols-[14rem_1fr]">
              <dt className="text-mist">{k}</dt>
              <dd className="text-ivory/90">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
