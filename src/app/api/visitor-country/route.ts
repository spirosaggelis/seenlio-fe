import { NextRequest, NextResponse } from 'next/server';
import { getVisitorCountry } from '@/lib/affiliateDestination';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return NextResponse.json(
    { country: getVisitorCountry(request.headers, null) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
