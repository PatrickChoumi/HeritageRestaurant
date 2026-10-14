// Base locale (PGlite) : crée un compte administrateur au premier démarrage pour la démo.
// En production (PostgreSQL), aucun compte n'est créé automatiquement : `npm run admin:create`.
import { randomBytes } from 'node:crypto';
import type { Db } from './types';
import { adminUsers } from './schema';
import { adminCount } from './seed';
import { hashPassword } from '@/lib/auth/password';

export async function bootstrapLocalAdmin(db: Db): Promise<void> {
  if ((await adminCount(db)) > 0) return;

  const email = (process.env.ADMIN_EMAIL ?? 'admin@heritage.local').trim().toLowerCase();
  const provided = process.env.ADMIN_PASSWORD;
  const password = provided && provided.length >= 12 ? provided : generatePassword();
  await db.insert(adminUsers).values({ email, name: 'Administrateur', passwordHash: await hashPassword(password) });

  const line = '─'.repeat(58);
  console.info(
    `\n${line}\n  Administration Héritage : compte de démonstration créé\n  Adresse      : /admin\n  Identifiant  : ${email}`,
  );
  console.info(
    provided
      ? '  Mot de passe : celui de ADMIN_PASSWORD'
      : `  Mot de passe : ${password}\n  (affiché une seule fois : notez-le)`,
  );
  console.info(`${line}\n`);
}

export function generatePassword(): string {
  // 18 caractères sans symboles ambigus, ≈ 100 bits d'entropie
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(32);
  let out = '';
  for (const b of bytes) {
    if (b < 228 && out.length < 18) out += alphabet[b % alphabet.length];
  }
  return out.length === 18 ? out : generatePassword();
}
