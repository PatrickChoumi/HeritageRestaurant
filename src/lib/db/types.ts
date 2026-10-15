import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type * as schema from './schema';

/** Base de données Drizzle, quel que soit le pilote (PostgreSQL ou PGlite). */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
