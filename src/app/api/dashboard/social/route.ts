import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

interface AnalyticsEvent {
  id: number;
  metricType: string;
  value: number;
  platform: string;
  country: string | null;
  recordedAt: string;
  publishRecord: {
    id: number;
    publishedAt?: string | null;
    platformAccount?: { accountName?: string } | null;
  } | null;
  product: { id: number; name?: string; sourcePlatform?: string | null } | null;
}

async function fetchAllEvents(from: string, to: string): Promise<AnalyticsEvent[]> {
  const all: AnalyticsEvent[] = [];
  let page = 1;
  let pageCount = Infinity;

  while (page <= pageCount) {
    const params = new URLSearchParams({
      'populate[0]': 'publishRecord',
      'populate[1]': 'publishRecord.platformAccount',
      'populate[2]': 'product',
      'filters[publishRecord][publishedAt][$gte]': `${from}T00:00:00.000Z`,
      'filters[publishRecord][publishedAt][$lte]': `${to}T23:59:59.999Z`,
      'pagination[pageSize]': '500',
      'pagination[page]': String(page),
      'sort': 'recordedAt:desc',
    });

    const res = await fetch(`${STRAPI_URL}/api/analytics-events?${params}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      next: { revalidate: 300 },
    });

    if (!res.ok) break;
    const json = await res.json();
    const items: AnalyticsEvent[] = json.data ?? [];
    if (items.length === 0) break;

    all.push(...items);

    const pag = json.meta?.pagination;
    if (pag?.pageCount != null) pageCount = pag.pageCount;
    page++;
  }

  return all;
}

export interface PivotRow {
  product: string;
  sourcePlatform: string;
  platform: string;
  channel: string;
  published: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams;
  const to = sp.get('to') ?? new Date().toISOString().split('T')[0];
  const from = sp.get('from') ?? new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];

  const events = await fetchAllEvents(from, to);

  // Deduplicate: for each (publishRecordId, metricType, country), keep the latest value.
  // Events are sorted desc by recordedAt so the first seen is the latest.
  const latestMap = new Map<string, AnalyticsEvent>();
  for (const e of events) {
    const key = `${e.publishRecord?.id ?? 'none'}_${e.metricType}_${e.country ?? ''}`;
    if (!latestMap.has(key)) latestMap.set(key, e);
  }
  const latest = [...latestMap.values()];

  // KPI totals (global only)
  const totals: Record<string, number> = {};
  for (const e of latest) {
    if (!e.country) {
      totals[e.metricType] = (totals[e.metricType] ?? 0) + e.value;
    }
  }

  // Views by platform
  const platformMap = new Map<string, number>();
  for (const e of latest) {
    if (e.metricType === 'views' && !e.country) {
      platformMap.set(e.platform, (platformMap.get(e.platform) ?? 0) + e.value);
    }
  }
  const byPlatform = [...platformMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Daily timeseries — bucketed by publish date (latest snapshot per record)
  const dateEventMap = new Map<string, Map<string, number>>();
  for (const e of latest) {
    if (e.metricType === 'views' && !e.country) {
      const publishedAt = e.publishRecord?.publishedAt;
      if (!publishedAt) continue;
      const day = publishedAt.split('T')[0];
      if (!dateEventMap.has(day)) dateEventMap.set(day, new Map());
      const dayMap = dateEventMap.get(day)!;
      const key = String(e.publishRecord?.id ?? e.id);
      if (!dayMap.has(key)) dayMap.set(key, e.value);
    }
  }
  const timeseries = [...dateEventMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayMap]) => ({
      date,
      value: [...dayMap.values()].reduce((s, v) => s + v, 0),
    }));

  // Top videos by views
  const videoMap = new Map<string, { name: string; value: number }>();
  for (const e of latest) {
    if (e.metricType === 'views' && !e.country) {
      const key = String(e.publishRecord?.id ?? e.id);
      const name = e.product?.name ?? `Record #${key}`;
      const prev = videoMap.get(key)?.value ?? 0;
      videoMap.set(key, { name, value: prev + e.value });
    }
  }
  const topVideos = [...videoMap.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Pivot rows: one row per (publishRecordId), all metrics as columns
  const METRICS = ['views', 'likes', 'shares', 'comments'] as const;
  const pivotByRecord = new Map<number, PivotRow>();

  for (const e of latest) {
    if (!e.publishRecord?.id || e.country) continue;
    const recId = e.publishRecord.id;
    if (!pivotByRecord.has(recId)) {
      const pa = e.publishRecord.platformAccount;
      const rawDate = e.publishRecord.publishedAt;
      pivotByRecord.set(recId, {
        product: e.product?.name ?? '—',
        sourcePlatform: e.product?.sourcePlatform ?? '—',
        platform: e.platform,
        channel: pa?.accountName ?? '—',
        published: rawDate ? rawDate.replace('T', ' ').substring(0, 16) : '—',
        views: 0, likes: 0, shares: 0, comments: 0,
      });
    }
    const row = pivotByRecord.get(recId)!;
    const metric = e.metricType as typeof METRICS[number];
    if (METRICS.includes(metric)) {
      (row as unknown as Record<string, number>)[metric] = (row[metric] ?? 0) + e.value;
    }
  }

  const pivotRows: PivotRow[] = [...pivotByRecord.values()].sort((a, b) => b.views - a.views);

  return NextResponse.json({ totals, byPlatform, timeseries, topVideos, pivotRows });
}
