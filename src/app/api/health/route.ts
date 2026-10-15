// GET /api/health : état du service (surveillance, hébergeur).
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb, usesEmbeddedDatabase } from '@/lib/db/client';
import { emailMode } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({
      status: 'ok',
      database: usesEmbeddedDatabase() ? 'pglite' : 'postgresql',
      email: emailMode(),
    });
  } catch {
    return NextResponse.json({ status: 'error', database: 'unreachable' }, { status: 503 });
  }
}
