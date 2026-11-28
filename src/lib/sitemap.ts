import { isProductIndexable, type IndexableProduct } from '@/lib/indexing';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
export const LOOKUP_PAGE_LASTMOD = '2026-08-23T00:00:00.000Z';
export const LEGAL_PAGE_LASTMOD = '2026-11-19T00:00:00.000Z';
/** Short enough that a new guide or newly indexable product shows up within 10 minutes. */
export const SITEMAP_REVALIDATE = 600;

export const SITEMAP_XML_HEADERS = {
  'Content-Type': 'application/xml',
  'Cache-Control': 'public, max-age=600, s-maxage=600',
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

/** Latest real timestamp. Empty when every value is missing — never "now". */
export function latestIso(...values: (string | Date | null | undefined)[]): string | null {
  let maxMs = 0;
  for (const v of values) {
    if (!v) continue;
    const ms = new Date(v).getTime();
    if (!Number.isNaN(ms) && ms > maxMs) maxMs = ms;
  }
  return maxMs > 0 ? new Date(maxMs).toISOString() : null;
}

/** Product sitemap lastmod: the later of the row update and the rewrite stamp. */
export function productSitemapLastmod(row: {
  updatedAt?: string | null;
  seo?: {
    structuredData?: { uniqueCopyAt?: string | null } | null;
  } | null;
}): string | null {
  const unique = row.seo?.structuredData?.uniqueCopyAt;
  return latestIso(row.updatedAt, unique);
}

function withoutInvalidKey(params: URLSearchParams, keyName: string): URLSearchParams | null {
  const next = new URLSearchParams(params);
  let removed = false;
  for (const [key, value] of [...next.entries()]) {
    if (value === keyName || value.includes(keyName) || key.includes(keyName)) {
      next.delete(key);
      removed = true;
    }
  }
  return removed ? next : null;
}

/**
 * Strapi rejects unknown fields with 400. Drop that key and retry so a sitemap
 * build still works in the window before a new CMS column is deployed.
 */
export async function strapiFetch(path: string, params: URLSearchParams): Promise<StrapiListResponse> {
  let current = params;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${STRAPI_URL}/api${path}?${current}`, {
      headers: strapiHeaders(),
      next: { revalidate: SITEMAP_REVALIDATE },
    });
    if (res.ok) return res.json();
    let missing = '';
    try {
      const body = await res.json();
      const message = String(body?.error?.message || '');
      missing = message.match(/Invalid key (\w+)/)?.[1] || '';
    } catch {
      missing = '';
    }
    if (res.status !== 400 || !missing) return {};
    const retry = withoutInvalidKey(current, missing);
    if (!retry) return {};
    current = retry;
  }
  return {};
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

const PUBLISHED_VISIBLE_PRODUCT_FILTERS = {
  'filters[productStatus][$eq]': 'published',
  'filters[$or][0][sourcePlatform][$null]': 'true',
  'filters[$or][1][sourcePlatform][$ne]': 'temu',
  'filters[$or][2][affiliateLinks][url][$contains]': 'temu.to',
};

export function appendVisibleProductFilters(params: URLSearchParams): void {
  for (const [key, value] of Object.entries(PUBLISHED_VISIBLE_PRODUCT_FILTERS)) {
    params.set(key, value);
  }
}

/** Newest product URL lastmod across the month files. */
export async function fetchProductsMaxContentLastmod(): Promise<string | null> {
  const buckets = await fetchProductMonthBuckets();
  return latestIso(...buckets.map((bucket) => bucket.lastmod));
}

export async function fetchListiclesMaxLastmod(): Promise<string | null> {
  return fetchLatestField('listicles', 'updatedAt', {
    'filters[listicleStatus][$eq]': 'published',
  });
}

/** Newest real content change across products and guides. */
export async function fetchSiteContentMaxLastmod(): Promise<string | null> {
  const [products, listicles] = await Promise.all([
    fetchProductsMaxContentLastmod(),
    fetchListiclesMaxLastmod(),
  ]);
  return latestIso(products, listicles);
}

export interface ProductMonthBucket {
  id: string;
  lastmod: string;
}

type SitemapClockProduct = IndexableProduct & {
  createdAt?: string;
  updatedAt?: string | null;
  seo?: IndexableProduct['seo'] & {
    structuredData?: { editorialIntro?: string | null; uniqueCopyAt?: string | null } | null;
  };
};

/** Published, indexable products grouped by createdAt month. */
export async function fetchProductMonthBuckets(): Promise<ProductMonthBucket[]> {
  const buckets = new Map<string, number>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      'fields[0]': 'createdAt',
      'fields[1]': 'updatedAt',
      'fields[2]': 'seoReady',
      'pagination[pageSize]': '100',
      'pagination[page]': String(page),
      'populate[seo][fields][0]': 'structuredData',
    });
    appendVisibleProductFilters(params);
    const data = await strapiFetch('/products', params);

    for (const row of data.data || []) {
      const attrs = unwrapRow<SitemapClockProduct>(row);
      if (!isProductIndexable(attrs)) continue;
      const created = attrs.createdAt ? new Date(attrs.createdAt) : null;
      if (!created || Number.isNaN(created.getTime())) continue;

      const monthId = `${created.getFullYear()}_${created.getMonth() + 1}`;
      const stamp = productSitemapLastmod(attrs);
      const stampMs = stamp ? new Date(stamp).getTime() : created.getTime();
      const prev = buckets.get(monthId) ?? 0;
      if (stampMs > prev) buckets.set(monthId, stampMs);
    }

    const pageCount = data.meta?.pagination?.pageCount ?? 1;
    if (page < pageCount) page++;
    else hasMore = false;
  }

  return Array.from(buckets.entries())
    .map(([id, ms]) => ({ id, lastmod: new Date(ms).toISOString() }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function lastmodXml(lastmod: string | null | undefined): string {
  return lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
}

/** Latest real timestamp. Never earlier than datePublished when that is set. */
export function editorialLastmod(
  published?: string | null,
  ...rest: Array<string | null | undefined>
): string | null {
  const publishedIso = toLastmod(published);
  const times = [publishedIso, ...rest.map((value) => toLastmod(value))].filter(
    (value): value is string => Boolean(value),
  );
  if (times.length === 0) return null;
  const latest = times.reduce((a, b) => (a > b ? a : b));
  if (publishedIso && latest < publishedIso) return publishedIso;
  return latest;
}

export interface CategorySitemapEntry {
  slug: string;
  lastmod: string | null;
}

/** Category lastmod is the category record's own update time. */
export async function fetchCategorySitemapEntries(): Promise<CategorySitemapEntry[]> {
  const categories: CategorySitemapEntry[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      'fields[0]': 'slug',
      'fields[1]': 'updatedAt',
      'pagination[pageSize]': '100',
      'pagination[page]': String(page),
      'filters[isActive][$eq]': 'true',
    });
    const data = await strapiFetch('/categories', params);
    for (const row of data.data || []) {
      const cat = unwrapRow<{ slug?: string; updatedAt?: string }>(row);
      if (cat.slug) categories.push({ slug: cat.slug, lastmod: toLastmod(cat.updatedAt) });
    }
    const pageCount = data.meta?.pagination?.pageCount ?? 1;
    if (page < pageCount) page++;
    else hasMore = false;
  }

  return categories;
}
