// Applique les migrations SQL (dossier drizzle/) sur la base PostgreSQL de DATABASE_URL.
// Sans DATABASE_URL, la base locale PGlite est migrée automatiquement au démarrage : rien à faire.
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.info('DATABASE_URL non défini : la base locale PGlite est migrée automatiquement par l’application.');
  process.exit(0);
}

const [{ drizzle }, { migrate }, { default: postgres }] = await Promise.all([
  import('drizzle-orm/postgres-js'),
  import('drizzle-orm/postgres-js/migrator'),
  import('postgres'),
]);
const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  console.info('✓ Migrations appliquées.');
} finally {
  await client.end();
}
