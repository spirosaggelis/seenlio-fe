import { NextRequest, NextResponse } from 'next/server';
import { fetchEvents, parseDateRange, groupByDay } from '@/lib/dashboard-api';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { from, to } = parseDateRange(req.nextUrl.searchParams);

  const events = await fetchEvents({
    event_type: 'search',
    from,
    to,
    fields: ['event_type', 'query', 'results_count', 'createdAt'],
  });

  // Daily search volume
  const timeseries = groupByDay(events);

  // Top queries
  const queryMap = new Map<string, { count: number; totalResults: number }>();
  for (const e of events) {
    const q = (e.query ?? '').trim().toLowerCase();
    if (!q) continue;
    const existing = queryMap.get(q);
    if (existing) {
      existing.count++;
      existing.totalResults += e.results_count ?? 0;
    } else {
      queryMap.set(q, { count: 1, totalResults: e.results_count ?? 0 });
    }
  }

  const topQueries = [...queryMap.entries()]
    .map(([query, data]) => ({
      query,
      count: data.count,
      avgResults: data.count > 0 ? Math.round(data.totalResults / data.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const zeroResults = topQueries.filter((q) => q.avgResults === 0).slice(0, 20);

  return NextResponse.json({
    timeseries,
    topQueries,
    zeroResults,
    totalSearches: events.length,
  });
}
