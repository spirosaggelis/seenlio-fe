import { NextRequest, NextResponse } from 'next/server';
import { ga4EventDateParams, isBqConfigured, runBqQuery } from '@/lib/bq/client';
import { pageViewsTotalSql } from '@/lib/bq/siteAnalyticsQueries';

interface TotalRow {
  total: number | string | null;
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Rolling window of page_view events (GA4 / BigQuery), in days. Default 365. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const daysRaw = req.nextUrl.searchParams.get('days');
  const days = Math.min(3650, Math.max(1, Number(daysRaw) || 365));

  if (!isBqConfigured()) {
    return NextResponse.json({ total: 0, days });
  }

  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const params = ga4EventDateParams(isoDate(start), isoDate(end));

  try {
    const rows = await runBqQuery<TotalRow>(pageViewsTotalSql(), params);
    const total = num(rows[0]?.total);
    return NextResponse.json(
      { total, days },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (err) {
    console.error('[stats/page-views] BigQuery error:', err);
    return NextResponse.json({ total: 0, days });
  }
}
