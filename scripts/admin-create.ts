// Crée le compte d'administration, ou réinitialise son mot de passe s'il existe déjà.
//   npm run admin:create -- --email chef@heritage.cm --name "Chef Héritage"
// Mot de passe : ADMIN_PASSWORD (12 caractères minimum) ou mot de passe aléatoire affiché une seule fois.
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { adminSessions, adminUsers } from '@/lib/db/schema';
import { hashPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { generatePassword } from '@/lib/db/bootstrap-admin';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const email = (arg('email') ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const name = arg('name');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Indiquez une adresse e-mail : npm run admin:create -- --email vous@exemple.com');
  process.exit(1);
}
const provided = process.env.ADMIN_PASSWORD;
if (provided && provided.length < PASSWORD_MIN_LENGTH) {
  console.error(`ADMIN_PASSWORD doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`);
  process.exit(1);
}
const password = provided ?? generatePassword();

const db = await getDb();
const passwordHash = await hashPassword(password);
const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
if (existing) {
  await db
    .update(adminUsers)
    .set({ passwordHash, ...(name ? { name } : {}) })
    .where(eq(adminUsers.id, existing.id));
  await db.delete(adminSessions).where(eq(adminSessions.userId, existing.id));
  console.info(`✓ Mot de passe réinitialisé pour ${email} (sessions ouvertes fermées).`);
} else {
  await db.insert(adminUsers).values({ email, name: name ?? 'Administrateur', passwordHash });
  console.info(`✓ Compte créé : ${email}`);
}
console.info(
  provided
    ? '  Mot de passe : celui de ADMIN_PASSWORD'
    : `  Mot de passe : ${password}\n  (affiché une seule fois : notez-le)`,
);
process.exit(0);
