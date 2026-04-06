/**
 * Shared helpers for dashboard aggregation API routes.
 * All routes query Strapi's site-events collection and aggregate in-memory.
 */

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

export interface SiteEvent {
  id: number;
  event_type: string;
  session_id: string | null;
  page: string | null;
  query: string | null;
  results_count: number | null;
  click_source: string | null;
  ip_hash: string | null;
  country: string | null;
  device_type: string | null;
  referrer: string | null;
  referrer_source: string | null;
  affiliate_platform: string | null;
  createdAt: string;
  product: { id: number; name: string; slug: string; productCode: string } | null;
}

interface FetchEventsOptions {
  event_type?: string | string[];
  from: string;
  to: string;
  fields?: string[];
  populate?: string[];
  pageSize?: number;
}

/** Fetch all events matching the given filters, handling Strapi pagination. */
export async function fetchEvents(opts: FetchEventsOptions): Promise<SiteEvent[]> {
  const {
    event_type,
    from,
    to,
    fields = ['event_type', 'session_id', 'page', 'ip_hash', 'country', 'device_type', 'referrer_source', 'affiliate_platform', 'click_source', 'query', 'results_count', 'createdAt'],
    populate = [],
    pageSize = 5000,
  } = opts;

  // Use UTC boundaries so timezone doesn't cut off events
  const fromISO = `${from}T00:00:00.000Z`;
  const toISO = `${to}T23:59:59.999Z`;

  const params = new URLSearchParams();
  params.set('filters[createdAt][$gte]', fromISO);
  params.set('filters[createdAt][$lte]', toISO);

  if (event_type) {
    const types = Array.isArray(event_type) ? event_type : [event_type];
    types.forEach((t, i) => params.set(`filters[event_type][$in][${i}]`, t));
  }

  fields.forEach((f, i) => params.set(`fields[${i}]`, f));
  if (populate.length) params.set('populate', populate.join(','));

  params.set('pagination[pageSize]', String(pageSize));
  params.set('pagination[page]', '1');
  params.set('sort', 'createdAt:desc');

  const all: SiteEvent[] = [];
  let page = 1;
  let total = Infinity;

  while (all.length < total && all.length < 50_000) {
    params.set('pagination[page]', String(page));
    const res = await fetch(`${STRAPI_URL}/api/site-events?${params}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      next: { revalidate: 120 },
    });
    if (!res.ok) break;
    const json = await res.json();
    const items: SiteEvent[] = json.data ?? [];
    all.push(...items);
    total = json.meta?.pagination?.total ?? items.length;
    if (items.length < pageSize) break;
    page++;
  }

  return all;
}

/** Count distinct values by a field */
export function countBy<T>(items: T[], key: keyof T): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const v = String(item[key] ?? 'unknown');
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Group events by date (YYYY-MM-DD) */
export function groupByDay(items: SiteEvent[]): Array<{ date: string; value: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const day = item.createdAt.split('T')[0];
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Parse date range from URL search params with defaults */
export function parseDateRange(searchParams: { get: (k: string) => string | null }) {
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0];
  const from =
    searchParams.get('from') ??
    new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];
  return { from, to };
}

/** Get the Next.js base URL for internal API calls (server-side only) */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}
