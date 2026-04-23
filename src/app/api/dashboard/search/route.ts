import { NextRequest, NextResponse } from 'next/server';
import { parseDateRange } from '@/lib/dashboard-api';
import { ga4EventDateParams, isBqConfigured, runBqQuery } from '@/lib/bq/client';
import { formatBqEventDate, searchTimeseriesSql, searchTopSql } from '@/lib/bq/siteAnalyticsQueries';

interface TsRow {
  event_date: unknown;
  value: number | string | null;
}

interface TopRow {
  search_term: string | null;
  cnt: number | string | null;
  avg_results: number | string | null;
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { from, to } = parseDateRange(req.nextUrl.searchParams);
  const params = ga4EventDateParams(from, to);

  if (!isBqConfigured()) {
    return NextResponse.json({
      timeseries: [],
      topQueries: [],
      zeroResults: [],
      totalSearches: 0,
    });
  }

  try {
    const [tsRows, topRows] = await Promise.all([
      runBqQuery<TsRow>(searchTimeseriesSql(), params),
      runBqQuery<TopRow>(searchTopSql(), params),
    ]);

    const timeseries = tsRows.map((r) => ({
      date: formatBqEventDate(r.event_date),
      value: num(r.value),
    }));

    const topQueries = topRows.map((r) => ({
      query: String(r.search_term ?? ''),
      count: num(r.cnt),
      avgResults: Math.round(num(r.avg_results)),
    }));

    const zeroResults = topQueries.filter((q) => q.avgResults === 0).slice(0, 20);
    const totalSearches = timeseries.reduce((s, r) => s + r.value, 0);

    return NextResponse.json({
      timeseries,
      topQueries,
      zeroResults,
      totalSearches,
    });
  } catch (err) {
    console.error('[dashboard/search] BigQuery error:', err);
    return NextResponse.json({
      timeseries: [],
      topQueries: [],
      zeroResults: [],
      totalSearches: 0,
    });
  }
}
