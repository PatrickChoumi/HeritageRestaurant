// Limitation de débit stockée en base : partagée entre toutes les instances du serveur
// (contrairement à un compteur en mémoire, elle tient aussi en hébergement serverless).
import 'server-only';
import { createHash } from 'node:crypto';
import { lt, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db/client';
import { rateLimits } from '@/lib/db/schema';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const db = await getDb();
  const resetAt = new Date(Date.now() + windowSeconds * 1000);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= now() then excluded.reset_at else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

  // Ménage occasionnel des compteurs expirés
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(lt(rateLimits.resetAt, sql`now() - interval '1 day'`));
  }
  const count = row?.count ?? 1;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt: row?.resetAt ?? resetAt };
}

/**
 * Empreinte de l'adresse IP du visiteur (jamais stockée en clair).
 * Derrière Vercel ou un proxy de confiance, x-forwarded-for est fourni par l'hébergeur.
 */
export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || 'local';
  return createHash('sha256')
    .update(`${process.env.AUTH_SECRET ?? 'heritage'}:${ip}`)
    .digest('hex')
    .slice(0, 32);
}
