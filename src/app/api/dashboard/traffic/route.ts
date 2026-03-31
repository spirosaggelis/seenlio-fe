import { NextRequest, NextResponse } from 'next/server';
import { fetchEvents, parseDateRange, countBy, groupByDay } from '@/lib/dashboard-api';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { from, to } = parseDateRange(req.nextUrl.searchParams);

  const events = await fetchEvents({ event_type: 'page_view', from, to });

  const timeseries = groupByDay(events);

  // Top pages
  const pageCount = new Map<string, number>();
  for (const e of events) {
    if (e.page) pageCount.set(e.page, (pageCount.get(e.page) ?? 0) + 1);
  }
  const topPages = [...pageCount.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  const referrers = countBy(events, 'referrer_source');
  const devices = countBy(events, 'device_type');
  const countries = countBy(events, 'country').slice(0, 15);

  return NextResponse.json({ timeseries, topPages, referrers, devices, countries });
}
