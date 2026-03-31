import { pushToDataLayer } from './datalayer';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'affiliate_click'
  | 'search'
  | 'category_browse'
  | 'filter_use';

interface SiteEventPayload {
  event_type: EventType;
  session_id?: string;
  page?: string;
  product_code?: string;
  query?: string;
  results_count?: number;
  filters_json?: Record<string, unknown>;
  affiliate_platform?: string;
  duration_ms?: number;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

// ─── Event buffer ─────────────────────────────────────────────────────────────

const buffer: SiteEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  if (!buffer.length) return;
  const events = buffer.splice(0);
  const payload = JSON.stringify(events);

  // Use sendBeacon on tab close (guaranteed delivery), fetch otherwise
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([payload], { type: 'application/json' }));
  } else {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
  flushTimer = null;
}

function scheduleFlush(): void {
  if (typeof window === 'undefined') return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 1500);
}

// Flush immediately when the tab goes to background / closes
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

function enqueue(payload: SiteEventPayload): void {
  if (typeof window === 'undefined') return;
  buffer.push({
    ...payload,
    page: payload.page ?? window.location.pathname,
    referrer: payload.referrer ?? (document.referrer || undefined),
  });
  scheduleFlush();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Generic low-level event (kept for backward compatibility) */
export function trackEvent(event: string, properties: Record<string, unknown> = {}): void {
  enqueue({ event_type: event as EventType, metadata: { ...properties } });
}

/** Product page opened */
export function trackProductView(productCode: string): void {
  enqueue({ event_type: 'product_view', product_code: productCode });
  pushToDataLayer({ event: 'product_view', product_code: productCode, page_path: typeof window !== 'undefined' ? window.location.pathname : '' });
}

/** Product card clicked from a listing */
export function trackProductClick(productCode: string, fromPage: string): void {
  enqueue({ event_type: 'product_click', product_code: productCode, page: fromPage });
  pushToDataLayer({ event: 'product_click', product_code: productCode, page_path: fromPage });
}

/** Affiliate link clicked */
export function trackAffiliateClick(productCode: string, platform: string, url: string): void {
  enqueue({
    event_type: 'affiliate_click',
    product_code: productCode,
    affiliate_platform: platform,
    metadata: { url },
  });
  pushToDataLayer({ event: 'affiliate_click', product_code: productCode, platform, url });
}

/** Search submitted */
export function trackSearch(query: string, resultsCount: number): void {
  enqueue({ event_type: 'search', query, results_count: resultsCount });
  pushToDataLayer({ event: 'search', query, results_count: resultsCount });
}

/** Category page browsed */
export function trackCategoryBrowse(categorySlug: string): void {
  enqueue({ event_type: 'category_browse', metadata: { categorySlug } });
  pushToDataLayer({ event: 'category_browse', category_slug: categorySlug });
}

/** Filter changed on a listing page */
export function trackFilterUse(filters: Record<string, unknown>, page: string): void {
  enqueue({ event_type: 'filter_use', filters_json: filters, page });
  pushToDataLayer({ event: 'filter_use', filters, page_path: page });
}

/** Time spent on page — call on unload/visibilitychange with elapsed ms */
export function trackTimeOnPage(page: string, durationMs: number): void {
  enqueue({ event_type: 'page_view', page, duration_ms: durationMs });
}

/** Build a trackable affiliate URL with UTM parameters */
export function buildAffiliateUrl(baseUrl: string, productCode: string, platform: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'seenlio');
  url.searchParams.set('utm_medium', platform);
  url.searchParams.set('utm_campaign', productCode);
  return url.toString();
}
