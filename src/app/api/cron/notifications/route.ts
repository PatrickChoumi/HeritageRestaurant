// Tâche planifiée : relance des e-mails de réservation en échec (Vercel Cron ou tout planificateur).
// Protégée par CRON_SECRET : l'appel doit porter l'en-tête « Authorization: Bearer <CRON_SECRET> ».
import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { retryPendingNotifications } from '@/lib/reservations/notify';

export const dynamic = 'force-dynamic';

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get('authorization') ?? '');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const retried = await retryPendingNotifications(50);
  return NextResponse.json({ retried });
}
