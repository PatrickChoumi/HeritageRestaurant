// Envoi des e-mails, avec trois modes choisis automatiquement :
//   1. RESEND_API_KEY défini → API Resend (recommandé sur Vercel)
//   2. SMTP_HOST défini      → Nodemailer (n'importe quel serveur SMTP : Gmail, OVH, Brevo…)
//   3. sinon                 → mode développement : l'e-mail est écrit dans .outbox/ (ouvrable dans un navigateur)
import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { EmailContent } from './templates';

export interface OutgoingEmail extends EmailContent {
  to: string;
  replyTo?: string;
}

export type EmailMode = 'resend' | 'smtp' | 'outbox';

export function emailMode(): EmailMode {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST) return 'smtp';
  return 'outbox';
}

const from = () => process.env.MAIL_FROM ?? 'Héritage <reservations@heritage.local>';

/** Adresse de l'établissement qui reçoit les alertes. */
export const restaurantInbox = () => process.env.RESTAURANT_EMAIL ?? 'restaurant@heritage.local';

export async function sendEmail(email: OutgoingEmail): Promise<{ id?: string; mode: EmailMode }> {
  const mode = emailMode();

  if (mode === 'resend') {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: from(),
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: email.replyTo,
    });
    if (error) throw new Error(`Resend : ${error.message}`);
    return { id: data?.id, mode };
  }

  if (mode === 'smtp') {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } : undefined,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
    const info = await transport.sendMail({
      from: from(),
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: email.replyTo,
    });
    return { id: info.messageId, mode };
  }

  // Mode développement : rien ne part, tout est consultable dans .outbox/
  const dir = process.env.OUTBOX_DIR ?? path.join(process.cwd(), '.outbox');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTo = email.to.replace(/[^a-z0-9@._-]/gi, '_');
  const file = path.join(dir, `${stamp}_${safeTo}.html`);
  try {
    await fs.mkdir(dir, { recursive: true });
    const header = `<!-- À : ${email.to}${email.replyTo ? ` | Répondre à : ${email.replyTo}` : ''}\n     Objet : ${email.subject} -->\n`;
    await fs.writeFile(file, header + email.html, 'utf8');
    console.info(`[e-mail] ${email.subject} → ${email.to} (aperçu : ${path.relative(process.cwd(), file)})`);
  } catch {
    // Système de fichiers en lecture seule (serverless) : on se contente du journal
    console.info(`[e-mail] ${email.subject} → ${email.to} (mode développement, non envoyé)`);
  }
  return { mode };
}
