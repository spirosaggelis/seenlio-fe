import { NextRequest, NextResponse } from 'next/server';
import { fetchEvents, parseDateRange, countBy } from '@/lib/dashboard-api';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { from, to } = parseDateRange(req.nextUrl.searchParams);

  const events = await fetchEvents({
    event_type: 'affiliate_click',
    from,
    to,
    fields: ['event_type', 'affiliate_platform', 'click_source', 'createdAt'],
    populate: ['product'],
  });

  const byPlatform = countBy(events, 'affiliate_platform');
  const bySource = countBy(events, 'click_source');

  // Top converting products by affiliate clicks
  const productMap = new Map<string, number>();
  for (const e of events) {
    const name = e.product?.name ?? 'Unknown';
    productMap.set(name, (productMap.get(name) ?? 0) + 1);
  }
  const topProducts = [...productMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  // Clicks over time
  const dailyMap = new Map<string, number>();
  for (const e of events) {
    const day = e.createdAt.split('T')[0];
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }
  const timeseries = [...dailyMap.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    total: events.length,
    byPlatform,
    bySource,
    topProducts,
    timeseries,
  });
}
