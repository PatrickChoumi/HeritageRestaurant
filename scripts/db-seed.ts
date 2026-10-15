// Remplit la carte de démonstration si elle est vide (idempotent).
// Si ADMIN_EMAIL et ADMIN_PASSWORD (12 caractères min.) sont définis et qu'aucun compte n'existe,
// crée le compte d'administration (pratique pour un premier déploiement sans accès à la base).
// Option --demo : ajoute aussi des réservations fictives (à éviter en production).
import { getDb } from '@/lib/db/client';
import { adminUsers } from '@/lib/db/schema';
import { adminCount, seedDemoReservationsIfEmpty, seedMenuIfEmpty } from '@/lib/db/seed';
import { hashPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';

const db = await getDb();
console.info(
  (await seedMenuIfEmpty(db)) ? '✓ Carte de démonstration ajoutée.' : '• La carte contient déjà des plats : rien à faire.',
);

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (email && password && password.length >= PASSWORD_MIN_LENGTH && (await adminCount(db)) === 0) {
  await db.insert(adminUsers).values({ email, name: 'Administrateur', passwordHash: await hashPassword(password) });
  console.info(`✓ Compte d'administration créé : ${email}`);
}

if (process.argv.includes('--demo')) {
  console.info(
    (await seedDemoReservationsIfEmpty(db)) ? '✓ Réservations fictives ajoutées.' : '• Des réservations existent déjà.',
  );
}
process.exit(0);
