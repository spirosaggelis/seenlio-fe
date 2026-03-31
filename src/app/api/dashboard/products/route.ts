import { NextRequest, NextResponse } from 'next/server';
import { fetchEvents, parseDateRange, SiteEvent } from '@/lib/dashboard-api';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { from, to } = parseDateRange(req.nextUrl.searchParams);

  const [viewEvents, clickEvents] = await Promise.all([
    fetchEvents({
      event_type: 'product_view',
      from,
      to,
      fields: ['event_type', 'createdAt'],
      populate: ['product'],
    }),
    fetchEvents({
      event_type: 'product_click',
      from,
      to,
      fields: ['event_type', 'createdAt'],
      populate: ['product'],
    }),
  ]);

  function aggregateByProduct(events: SiteEvent[]) {
    const map = new Map<string, { name: string; slug: string; count: number }>();
    for (const e of events) {
      const key = e.product?.productCode ?? 'unknown';
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, {
          name: e.product?.name ?? key,
          slug: e.product?.slug ?? '',
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }

  const viewsByProduct = aggregateByProduct(viewEvents);
  const clicksByProduct = aggregateByProduct(clickEvents);

  // CTR table: merge views + clicks per product
  const allProducts = new Map<string, { name: string; views: number; clicks: number }>();
  for (const p of viewsByProduct) {
    allProducts.set(p.name, { name: p.name, views: p.count, clicks: 0 });
  }
  for (const p of clicksByProduct) {
    const existing = allProducts.get(p.name);
    if (existing) {
      existing.clicks = p.count;
    } else {
      allProducts.set(p.name, { name: p.name, views: 0, clicks: p.count });
    }
  }

  const ctrTable = [...allProducts.values()]
    .map((p) => ({
      ...p,
      ctr: p.views > 0 ? Math.round((p.clicks / p.views) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 50);

  const topViewed = viewsByProduct.slice(0, 10).map((p) => ({ name: p.name, value: p.count }));
  const topClicked = clicksByProduct.slice(0, 10).map((p) => ({ name: p.name, value: p.count }));

  return NextResponse.json({ topViewed, topClicked, ctrTable });
}
