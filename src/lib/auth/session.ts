// Sessions de l'administration : jeton aléatoire de 256 bits dans un cookie HttpOnly,
// seule son empreinte SHA-256 est stockée en base. Expiration après inactivité et durée maximale.
import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, lt, ne, or } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/client';
import { adminSessions, adminUsers } from '@/lib/db/schema';
import { ADMIN_COOKIE, ADMIN_COOKIE_PATH, SESSION_IDLE_MS, SESSION_MAX_MS } from './constants';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export interface AdminSession {
  idHash: string;
  user: { id: number; email: string; name: string };
}

export async function createSession(userId: number): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  await db.insert(adminSessions).values({
    idHash: hash(token),
    userId,
    expiresAt: new Date(now + SESSION_MAX_MS),
  });
  // Ménage des sessions expirées
  await db
    .delete(adminSessions)
    .where(
      or(lt(adminSessions.expiresAt, new Date(now)), lt(adminSessions.lastSeenAt, new Date(now - SESSION_IDLE_MS))),
    );

  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: ADMIN_COOKIE_PATH,
    maxAge: SESSION_MAX_MS / 1000,
    priority: 'high',
  });
}

/** Session valide de la requête en cours, ou null. Prolonge l'inactivité au plus toutes les 5 minutes. */
export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const now = Date.now();
  const [row] = await db
    .select({
      idHash: adminSessions.idHash,
      lastSeenAt: adminSessions.lastSeenAt,
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(
      and(
        eq(adminSessions.idHash, hash(token)),
        gt(adminSessions.expiresAt, new Date(now)),
        gt(adminSessions.lastSeenAt, new Date(now - SESSION_IDLE_MS)),
      ),
    );
  if (!row) return null;
  if (now - row.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await db
      .update(adminSessions)
      .set({ lastSeenAt: new Date(now) })
      .where(eq(adminSessions.idHash, row.idHash));
  }
  return { idHash: row.idHash, user: { id: row.id, email: row.email, name: row.name } };
}

/** À appeler en tête de chaque page et de chaque action d'administration. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(adminSessions).where(eq(adminSessions.idHash, hash(token)));
  }
  store.delete({ name: ADMIN_COOKIE, path: ADMIN_COOKIE_PATH });
}

/** Ferme toutes les autres sessions (après un changement de mot de passe). */
export async function destroyOtherSessions(session: AdminSession): Promise<void> {
  const db = await getDb();
  await db
    .delete(adminSessions)
    .where(and(eq(adminSessions.userId, session.user.id), ne(adminSessions.idHash, session.idHash)));
}
