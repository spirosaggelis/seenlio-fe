const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
export const SITEMAP_REVALIDATE = 3600;

export const SITEMAP_XML_HEADERS = {
  'Content-Type': 'application/xml',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
} as const;

type StrapiListResponse = {
  data?: unknown[];
  meta?: { pagination?: { pageCount?: number } };
};

export function strapiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (STRAPI_API_TOKEN) headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
  return headers;
}

export function unwrapRow<T>(row: unknown): T {
  const r = row as Record<string, unknown>;
  return (r.attributes || r) as T;
}

export function toLastmod(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function maxLastmod(...values: (string | Date | null | undefined)[]): string {
  let maxMs = 0;
  for (const v of values) {
    if (!v) continue;
    const ms = new Date(v).getTime();
    if (!Number.isNaN(ms) && ms > maxMs) maxMs = ms;
  }
  return maxMs > 0 ? new Date(maxMs).toISOString() : new Date().toISOString();
}

async function strapiFetch(path: string, params: URLSearchParams): Promise<StrapiListResponse> {
  const res = await fetch(`${STRAPI_URL}/api${path}?${params}`, {
    headers: strapiHeaders(),
    next: { revalidate: SITEMAP_REVALIDATE },
  });
  if (!res.ok) return {};
  return res.json();
}

/** Most recent value of `field` on a collection (single row, sorted desc). */
export async function fetchLatestField(
  collection: string,
  field: string,
  filters: Record<string, string>,
): Promise<string | null> {
  const params = new URLSearchParams({
    [`fields[0]`]: field,
    'pagination[pageSize]': '1',
    'sort[0]': `${field}:desc`,
    ...filters,
  });
  const data = await strapiFetch(`/${collection}`, params);
  const row = data.data?.[0];
  if (!row) return null;
  const attrs = unwrapRow<Record<string, unknown>>(row);
  return toLastmod(attrs[field] as string);
}

export async function fetchProductsMaxUpdatedAt(): Promise<string | null> {
  return fetchLatestField('products', 'updatedAt', {
    'filters[productStatus][$eq]': 'published',
  });
}

export async function fetchCategoriesMaxUpdatedAt(): Promise<string | null> {
  return fetchLatestField('categories', 'updatedAt', {
    'filters[isActive][$eq]': 'true',
  });
}

export async function fetchListiclesMaxLastmod(): Promise<string | null> {
  const filter = { 'filters[listicleStatus][$eq]': 'published' };
  const [updated, published] = await Promise.all([
    fetchLatestField('listicles', 'updatedAt', filter),
    fetchLatestField('listicles', 'publishedOn', filter),
  ]);
  if (!updated && !published) return null;
  return maxLastmod(updated, published);
}

/** Max updatedAt across published products, active categories, and listicles. */
export async function fetchSiteContentMaxLastmod(): Promise<string> {
  const [products, categories, listicles] = await Promise.all([
    fetchProductsMaxUpdatedAt(),
    fetchCategoriesMaxUpdatedAt(),
    fetchListiclesMaxLastmod(),
  ]);
  return maxLastmod(products, categories, listicles);
}

export interface ProductMonthBucket {
  id: string;
  lastmod: string;
}

/** Published products grouped by createdAt month; lastmod = max updatedAt in each month. */
export async function fetchProductMonthBuckets(): Promise<ProductMonthBucket[]> {
  const buckets = new Map<string, number>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      'fields[0]': 'createdAt',
      'fields[1]': 'updatedAt',
      'pagination[pageSize]': '100',
      'pagination[page]': String(page),
      'filters[productStatus][$eq]': 'published',
    });
    const data = await strapiFetch('/products', params);

    for (const row of data.data || []) {
      const attrs = unwrapRow<{ createdAt?: string; updatedAt?: string }>(row);
      const created = attrs.createdAt ? new Date(attrs.createdAt) : null;
      if (!created || Number.isNaN(created.getTime())) continue;

      const monthId = `${created.getFullYear()}_${created.getMonth() + 1}`;
      const updatedMs = attrs.updatedAt
        ? new Date(attrs.updatedAt).getTime()
        : created.getTime();
      const prev = buckets.get(monthId) ?? 0;
      if (updatedMs > prev) buckets.set(monthId, updatedMs);
    }

    const pageCount = data.meta?.pagination?.pageCount ?? 1;
    if (page < pageCount) page++;
    else hasMore = false;
  }

  if (buckets.size === 0) {
    const now = new Date();
    return [{
      id: `${now.getFullYear()}_${now.getMonth() + 1}`,
      lastmod: now.toISOString(),
    }];
  }

  return Array.from(buckets.entries())
    .map(([id, ms]) => ({ id, lastmod: new Date(ms).toISOString() }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function lastmodXml(lastmod: string | null | undefined): string {
  return lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
}
