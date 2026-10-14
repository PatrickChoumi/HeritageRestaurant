// Remplit la carte de démonstration si elle est vide (idempotent).
// Option --demo : ajoute aussi des réservations fictives (à éviter en production).
import { getDb } from '@/lib/db/client';
import { seedDemoReservationsIfEmpty, seedMenuIfEmpty } from '@/lib/db/seed';

const db = await getDb();
console.info((await seedMenuIfEmpty(db)) ? '✓ Carte de démonstration ajoutée.' : '• La carte contient déjà des plats : rien à faire.');
if (process.argv.includes('--demo')) {
  console.info((await seedDemoReservationsIfEmpty(db)) ? '✓ Réservations fictives ajoutées.' : '• Des réservations existent déjà.');
}
process.exit(0);
