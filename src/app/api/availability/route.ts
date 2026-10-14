// GET /api/availability?date=AAAA-MM-JJ&guests=N : créneaux et places restantes (aucune donnée personnelle).
import { NextResponse, type NextRequest } from 'next/server';
import { getAvailability } from '@/lib/reservations/service';
import { isIsoDate } from '@/lib/reservations/time';
import { restaurant } from '@/lib/restaurant';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  const guests = Number(request.nextUrl.searchParams.get('guests') ?? 2);
  if (!isIsoDate(date) || !Number.isInteger(guests) || guests < 1 || guests > restaurant.reservation.maxGuestsOnline) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  try {
    const availability = await getAvailability(date, guests);
    return NextResponse.json(availability, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[disponibilités]', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
