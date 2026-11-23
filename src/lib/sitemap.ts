import { isProductIndexable, type IndexableProduct } from '@/lib/indexing';

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

/**
 * Last content change for a URL. Ignores updatedAt so a bulk rewrite of
 * unrelated fields (video state, IndexNow stamp, sitemap rebuild) does not
 * move every URL.
 */
export function contentLastmod(row: {
  contentUpdatedAt?: string | null;
  sitePublishedAt?: string | null;
  publishedOn?: string | null;
  createdAt?: string | null;
}): string | null {
  return (
    toLastmod(row.contentUpdatedAt) ||
    toLastmod(row.sitePublishedAt) ||
    toLastmod(row.publishedOn) ||
    toLastmod(row.createdAt)
  );
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

async function latestProductStamp(field: string, extra: Record<string, string> = {}): Promise<string | null> {
  return fetchLatestField('products', field, {
    ...PUBLISHED_VISIBLE_PRODUCT_FILTERS,
    [`filters[${field}][$notNull]`]: 'true',
    ...extra,
  });
}

/** Newest description/title/price edit, else newest publish, else newest create. */
export async function fetchProductsMaxContentLastmod(): Promise<string | null> {
  const [content, published, created] = await Promise.all([
    latestProductStamp('contentUpdatedAt'),
    latestProductStamp('sitePublishedAt'),
    latestProductStamp('createdAt'),
  ]);
  return latestIso(content, published, created);
}

export async function fetchListiclesMaxLastmod(): Promise<string | null> {
  const filter = { 'filters[listicleStatus][$eq]': 'published' };
  const [content, published, created] = await Promise.all([
    fetchLatestField('listicles', 'contentUpdatedAt', {
      ...filter,
      'filters[contentUpdatedAt][$notNull]': 'true',
    }),
    fetchLatestField('listicles', 'publishedOn', filter),
    fetchLatestField('listicles', 'createdAt', filter),
  ]);
  return latestIso(content, published, created);
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
  contentUpdatedAt?: string | null;
  sitePublishedAt?: string | null;
  seo?: IndexableProduct['seo'];
};

/** Published, indexable products grouped by createdAt month. */
export async function fetchProductMonthBuckets(): Promise<ProductMonthBucket[]> {
  const buckets = new Map<string, number>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      'fields[0]': 'createdAt',
      'fields[1]': 'contentUpdatedAt',
      'fields[2]': 'sitePublishedAt',
      'fields[3]': 'seoReady',
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
      const stamp = contentLastmod(attrs);
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

async function latestProductContentStamp(categorySlug: string): Promise<string | null> {
  const extra = { 'filters[categories][slug][$eq]': categorySlug };
  const [content, published, created] = await Promise.all([
    latestProductStamp('contentUpdatedAt', extra),
    latestProductStamp('sitePublishedAt', extra),
    latestProductStamp('createdAt', extra),
  ]);
  return latestIso(content, published, created);
}

/** Category lastmod moves when a product in that category is published or its copy changes. */
export async function fetchCategorySitemapEntries(): Promise<CategorySitemapEntry[]> {
  const categories: Array<{ slug: string; createdAt?: string }> = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      'fields[0]': 'slug',
      'fields[1]': 'createdAt',
      'pagination[pageSize]': '100',
      'pagination[page]': String(page),
      'filters[isActive][$eq]': 'true',
    });
    const data = await strapiFetch('/categories', params);
    for (const row of data.data || []) {
      const cat = unwrapRow<{ slug?: string; createdAt?: string }>(row);
      if (cat.slug) categories.push({ slug: cat.slug, createdAt: cat.createdAt });
    }
    const pageCount = data.meta?.pagination?.pageCount ?? 1;
    if (page < pageCount) page++;
    else hasMore = false;
  }

  return Promise.all(
    categories.map(async (cat) => {
      const productStamp = await latestProductContentStamp(cat.slug);
      return {
        slug: cat.slug,
        lastmod: latestIso(productStamp, cat.createdAt),
      };
    }),
  );
}
