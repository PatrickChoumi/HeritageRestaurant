// Connexion à la base de données.
//
// - DATABASE_URL défini  → PostgreSQL (Neon, Supabase, Vercel Postgres, serveur dédié…).
//   Les migrations se lancent explicitement : `npm run db:setup`.
// - DATABASE_URL absent  → PGlite : un vrai PostgreSQL embarqué (WebAssembly) dans .data/pglite,
//   migré et rempli automatiquement. Aucun service à installer pour tester le site.
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import * as schema from './schema';
import type { Db } from './types';
import { seedDemoReservationsIfEmpty, seedMenuIfEmpty } from './seed';
import { bootstrapLocalAdmin } from './bootstrap-admin';

export type { Db };

const globalForDb = globalThis as typeof globalThis & { __heritageDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.__heritageDb ??= createDb().catch((error) => {
    globalForDb.__heritageDb = undefined; // nouvel essai à la prochaine requête
    throw error;
  });
  return globalForDb.__heritageDb;
}

export const usesEmbeddedDatabase = () => !process.env.DATABASE_URL;

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const [{ drizzle }, { default: postgres }] = await Promise.all([
      import('drizzle-orm/postgres-js'),
      import('postgres'),
    ]);
    const client = postgres(url, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      // Compatible avec les pools en mode transaction (PgBouncer, Supabase, Neon)
      prepare: false,
      onnotice: () => {},
    });
    return drizzle(client, { schema }) as unknown as Db;
  }

  if (process.env.VERCEL) {
    throw new Error(
      'DATABASE_URL est obligatoire en production : créez une base PostgreSQL (Neon, Supabase…) et ajoutez son URL aux variables d’environnement.',
    );
  }
  return createEmbeddedDb();
}

async function createEmbeddedDb(): Promise<Db> {
  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
    import('drizzle-orm/pglite/migrator'),
  ]);

  // Pendant `next build`, plusieurs processus génèrent les pages en parallèle :
  // chacun utilise une base en mémoire (même contenu de départ) pour ne pas se disputer le dossier.
  const inMemory = process.env.NEXT_PHASE === 'phase-production-build' || process.env.PGLITE_MEMORY === '1';
  // Chemins lus à l'exécution (base locale de développement) : exclus du traçage des fichiers du build
  const dataDir = inMemory
    ? undefined
    : path.resolve(
        /* turbopackIgnore: true */ process.env.PGLITE_DATA_DIR ??
          path.join(/* turbopackIgnore: true */ process.cwd(), '.data', 'pglite'),
      );
  if (dataDir) acquireLock(dataDir);

  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzle(client, { schema }) as unknown as Db;
  await migrate(db as never, { migrationsFolder: path.join(/* turbopackIgnore: true */ process.cwd(), 'drizzle') });

  if (await seedMenuIfEmpty(db)) console.info('[héritage] Carte de démonstration ajoutée.');
  if (!inMemory) {
    if (await seedDemoReservationsIfEmpty(db)) console.info('[héritage] Réservations fictives ajoutées (démo).');
    await bootstrapLocalAdmin(db);
  }
  return db;
}

/** PGlite n'accepte qu'un seul processus à la fois sur un dossier : on le vérifie. */
function acquireLock(dataDir: string) {
  fs.mkdirSync(dataDir, { recursive: true });
  const lockFile = `${dataDir}.lock`;
  try {
    const pid = Number(fs.readFileSync(lockFile, 'utf8'));
    if (pid && pid !== process.pid && isAlive(pid)) {
      throw new Error(
        `La base locale ${dataDir} est déjà ouverte par un autre processus (pid ${pid}). ` +
          'Arrêtez `npm run dev` / `npm start` avant de lancer ce script, ou utilisez DATABASE_URL.',
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  fs.writeFileSync(lockFile, String(process.pid));
  const release = () => {
    try {
      if (Number(fs.readFileSync(lockFile, 'utf8')) === process.pid) fs.unlinkSync(lockFile);
    } catch {
      /* déjà supprimé */
    }
  };
  process.once('exit', release);
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}
