import { NextRequest, NextResponse } from 'next/server';
import { fetchEvents, parseDateRange, groupByDay } from '@/lib/dashboard-api';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { from, to } = parseDateRange(req.nextUrl.searchParams);

  const [pageViewEvents, allEvents] = await Promise.all([
    fetchEvents({ event_type: 'page_view', from, to }),
    fetchEvents({ from, to }),
  ]);

  // Previous period for delta calculation
  const rangeDays = Math.ceil(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - rangeDays);

  const [prevPageViews] = await Promise.all([
    fetchEvents({
      event_type: 'page_view',
      from: prevFrom.toISOString().split('T')[0],
      to: prevTo.toISOString().split('T')[0],
    }),
    fetchEvents({
      from: prevFrom.toISOString().split('T')[0],
      to: prevTo.toISOString().split('T')[0],
    }),
  ]);

  // Metrics
  const pageViews = pageViewEvents.length;
  const sessions = new Set(pageViewEvents.map((e) => e.session_id).filter(Boolean)).size;
  const uniqueVisitors = new Set(pageViewEvents.map((e) => e.ip_hash).filter(Boolean)).size;

  // Bounce rate: sessions with exactly 1 page view
  const sessionCounts = new Map<string, number>();
  for (const e of pageViewEvents) {
    if (e.session_id) sessionCounts.set(e.session_id, (sessionCounts.get(e.session_id) ?? 0) + 1);
  }
  const bounced = [...sessionCounts.values()].filter((c) => c === 1).length;
  const bounceRate = sessions > 0 ? Math.round((bounced / sessions) * 100) : 0;

  // Avg session duration — not tracked currently
  const avgDuration = 0;

  // Deltas
  const prevPageViewsCount = prevPageViews.length;
  const prevSessionsCount = new Set(prevPageViews.map((e) => e.session_id).filter(Boolean)).size;

  function delta(curr: number, prev: number) {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
  }

  // Daily timeseries
  const timeseries = groupByDay(pageViewEvents);

  return NextResponse.json({
    pageViews,
    sessions,
    uniqueVisitors,
    bounceRate,
    avgDuration,
    timeseries,
    deltas: {
      pageViews: delta(pageViews, prevPageViewsCount),
      sessions: delta(sessions, prevSessionsCount),
    },
  });
}
