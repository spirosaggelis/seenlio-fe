import { isProductIndexable } from '@/lib/indexing';
import { indexNowContext, notifyIndexNow } from '@/lib/indexnow';
import { latestIso, unwrapRow } from '@/lib/sitemap';
import { isHiddenTemuProduct } from '@/lib/temuAffiliate';

/**
 * A stamp write bumps updatedAt. Comparing with a few seconds of slack, and
 * writing the stamp slightly ahead of now, keeps that write from being
 * submitted again on the next pass.
 */
const STAMP_SKEW_MS = 5_000;
const STAMP_AHEAD_MS = 30_000;

type Collection = 'products' | 'listicles' | 'categories';

type PendingUrl = {
  url: string;
  collection: Collection;
  documentId: string;
};

export type IndexNowSyncResult = {
  status: number | null;
  submitted: string[];
  stamped: number;
  error?: string;
};

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

let inflight: Promise<IndexNowSyncResult> | null = null;

function needsSubmit(stamp: unknown, ...times: Array<string | null | undefined>): boolean {
  if (typeof stamp !== 'string' || !stamp) return true;
  const newest = latestIso(...times);
  if (!newest) return false;
  return new Date(newest).getTime() > new Date(stamp).getTime() + STAMP_SKEW_MS;
}

function pageUrl(origin: string, path: string): string {
  return `${origin.replace(/\/$/, '')}${path}`;
}

async function strapiList(
  path: string,
  params: URLSearchParams,
): Promise<{ data: Record<string, unknown>[]; pageCount: number } | { error: string }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (STRAPI_API_TOKEN) headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
  const res = await fetch(`${STRAPI_URL}/api${path}?${params}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = (await res.text()).replaceAll(STRAPI_API_TOKEN || '___', '[token]').slice(0, 300);
    return { error: `${path} status=${res.status} ${body}`.trim() };
  }
  const json = (await res.json()) as {
    data?: unknown[];
    meta?: { pagination?: { pageCount?: number } };
  };
  return {
    data: (json.data || []).map((row) => unwrapRow<Record<string, unknown>>(row)),
    pageCount: json.meta?.pagination?.pageCount ?? 1,
  };
}

async function eachPage(
  path: string,
  base: Record<string, string>,
): Promise<{ rows: Record<string, unknown>[] } | { error: string }> {
  const rows: Record<string, unknown>[] = [];
  let page = 1;
  let pageCount = 1;
  while (page <= pageCount && page <= 100) {
    const params = new URLSearchParams({
      ...base,
      'pagination[pageSize]': '100',
      'pagination[page]': String(page),
    });
    const result = await strapiList(path, params);
    if ('error' in result) return result;
    rows.push(...result.data);
    pageCount = result.pageCount;
    page += 1;
  }
  return { rows };
}

function linkRows(raw: unknown): Array<{ url?: string; isActive?: boolean }> {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : ((raw as { data?: unknown[] }).data ?? []);
  return list.map((row) => {
    const record = row as { attributes?: { url?: string; isActive?: boolean }; url?: string; isActive?: boolean };
    return record.attributes || record;
  });
}

function uniqueCopyAt(row: Record<string, unknown>): string | null {
  const seo = row.seo;
  if (!seo || typeof seo !== 'object') return null;
  const structured = (seo as { structuredData?: { uniqueCopyAt?: unknown } }).structuredData;
  return typeof structured?.uniqueCopyAt === 'string' ? structured.uniqueCopyAt : null;
}

async function collectProducts(origin: string): Promise<PendingUrl[] | { error: string }> {
  const listed = await eachPage('/products', {
    'fields[0]': 'slug',
    'fields[1]': 'updatedAt',
    'fields[2]': 'indexnowSubmittedAt',
    'fields[3]': 'seoReady',
    'fields[4]': 'productStatus',
    'fields[5]': 'sourcePlatform',
    'populate[seo][fields][0]': 'structuredData',
    'populate[affiliateLinks][fields][0]': 'url',
    'populate[affiliateLinks][fields][1]': 'isActive',
  });
  if ('error' in listed) return listed;

  const pending: PendingUrl[] = [];
  for (const row of listed.rows) {
    const slug = typeof row.slug === 'string' ? row.slug : '';
    const documentId = typeof row.documentId === 'string' ? row.documentId : '';
    if (!slug || !documentId) continue;
    const updatedAt = typeof row.updatedAt === 'string' ? row.updatedAt : null;
    const onSite = row.productStatus === 'published' && !isHiddenTemuProduct({
      sourcePlatform: typeof row.sourcePlatform === 'string' ? row.sourcePlatform : undefined,
      affiliateLinks: linkRows(row.affiliateLinks),
    });
    const url = pageUrl(origin, `/products/${slug}`);
    if (
      onSite &&
      isProductIndexable({
        seoReady: row.seoReady as boolean | null | undefined,
        seo: row.seo as { structuredData?: { editorialIntro?: string | null } | null } | null,
      }) &&
      needsSubmit(row.indexnowSubmittedAt, updatedAt, uniqueCopyAt(row))
    ) {
      pending.push({ url, collection: 'products', documentId });
    } else if (
      row.productStatus !== 'published' &&
      row.indexnowSubmittedAt &&
      needsSubmit(row.indexnowSubmittedAt, updatedAt)
    ) {
      pending.push({ url, collection: 'products', documentId });
    }
  }
  return pending;
}

async function collectListicles(origin: string): Promise<PendingUrl[] | { error: string }> {
  const listed = await eachPage('/listicles', {
    'fields[0]': 'slug',
    'fields[1]': 'updatedAt',
    'fields[2]': 'indexnowSubmittedAt',
    'fields[3]': 'listicleStatus',
  });
  if ('error' in listed) return listed;

  const pending: PendingUrl[] = [];
  for (const row of listed.rows) {
    const slug = typeof row.slug === 'string' ? row.slug : '';
    const documentId = typeof row.documentId === 'string' ? row.documentId : '';
    if (!slug || !documentId) continue;
    const updatedAt = typeof row.updatedAt === 'string' ? row.updatedAt : null;
    const published = row.listicleStatus === 'published';
    const url = pageUrl(origin, `/lists/${slug}`);
    if (published && needsSubmit(row.indexnowSubmittedAt, updatedAt)) {
      pending.push({ url, collection: 'listicles', documentId });
    } else if (!published && row.indexnowSubmittedAt && needsSubmit(row.indexnowSubmittedAt, updatedAt)) {
      pending.push({ url, collection: 'listicles', documentId });
    }
  }
  return pending;
}

async function collectCategories(origin: string): Promise<PendingUrl[] | { error: string }> {
  const listed = await eachPage('/categories', {
    'fields[0]': 'slug',
    'fields[1]': 'updatedAt',
    'fields[2]': 'indexnowSubmittedAt',
    'fields[3]': 'isActive',
  });
  if ('error' in listed) return listed;

  const pending: PendingUrl[] = [];
  for (const row of listed.rows) {
    const slug = typeof row.slug === 'string' ? row.slug : '';
    const documentId = typeof row.documentId === 'string' ? row.documentId : '';
    if (!slug || !documentId) continue;
    const updatedAt = typeof row.updatedAt === 'string' ? row.updatedAt : null;
    const active = row.isActive !== false;
    const url = pageUrl(origin, `/categories/${slug}`);
    if (active && needsSubmit(row.indexnowSubmittedAt, updatedAt)) {
      pending.push({ url, collection: 'categories', documentId });
    } else if (!active && row.indexnowSubmittedAt && needsSubmit(row.indexnowSubmittedAt, updatedAt)) {
      pending.push({ url, collection: 'categories', documentId });
    }
  }
  return pending;
}

async function stamp(collection: Collection, documentId: string, at: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (STRAPI_API_TOKEN) headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
    const res = await fetch(`${STRAPI_URL}/api/${collection}/${documentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ data: { indexnowSubmittedAt: at } }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 200);
      console.error(`[indexnow] stamp failed ${collection} status=${res.status} ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network error';
    console.error(`[indexnow] stamp failed ${collection} ${message}`);
    return false;
  }
}

async function stampAll(rows: PendingUrl[], at: string): Promise<number> {
  const queue = [...rows];
  let stamped = 0;
  async function worker() {
    for (;;) {
      const row = queue.shift();
      if (!row) return;
      if (await stamp(row.collection, row.documentId, at)) stamped += 1;
    }
  }
  await Promise.all(Array.from({ length: 6 }, () => worker()));
  return stamped;
}

async function syncOnce(): Promise<IndexNowSyncResult> {
  const ctx = indexNowContext();
  if (!ctx) {
    console.error('[indexnow] failed INDEXNOW_KEY is empty');
    return { status: null, submitted: [], stamped: 0, error: 'INDEXNOW_KEY is empty' };
  }
  if (ctx.host !== 'seenlio.com') {
    console.info(`[indexnow] skipped host ${ctx.host}`);
    return { status: null, submitted: [], stamped: 0 };
  }

  const errors: string[] = [];
  const pending: PendingUrl[] = [];
  for (const collect of [collectProducts, collectListicles, collectCategories]) {
    const result = await collect(ctx.origin);
    if ('error' in result) {
      errors.push(result.error);
      console.error(`[indexnow] scan failed ${result.error}`);
    } else {
      pending.push(...result);
    }
  }

  if (pending.length === 0) {
    const error = errors[0];
    console.info(`[indexnow] no urls to submit${error ? ` (${error})` : ''}`);
    return { status: null, submitted: [], stamped: 0, error };
  }

  const result = await notifyIndexNow(pending.map((row) => row.url));
  const accepted = new Set(result.submitted);
  const stampAt = new Date(Date.now() + STAMP_AHEAD_MS).toISOString();
  const stamped = await stampAll(
    pending.filter((row) => accepted.has(row.url)),
    stampAt,
  );
  return {
    status: result.status,
    submitted: result.submitted,
    stamped,
    error: result.error || errors[0],
  };
}

export function runIndexNowSync(): Promise<IndexNowSyncResult> {
  if (inflight) return inflight;
  inflight = syncOnce().finally(() => {
    inflight = null;
  });
  return inflight;
}
