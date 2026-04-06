import { pushToDataLayer } from './datalayer';
import { isAnalyticsDisabled } from '@/utils/analyticsDisable';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | 'page_view'
  | 'product_view'
  | 'affiliate_click'
  | 'search'
  | 'category_browse';

interface SiteEventPayload {
  event_type: EventType;
  session_id?: string;
  page?: string;
  product_code?: string;
  query?: string;
  results_count?: number;
  affiliate_platform?: string;
  click_source?: string;
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
  if (isAnalyticsDisabled()) return;
  if (window.location.pathname.startsWith('/dashboard')) return;
  buffer.push({
    ...payload,
    page: payload.page ?? window.location.pathname,
    referrer: payload.referrer ?? (document.referrer || undefined),
  });
  scheduleFlush();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Product page opened */
export function trackProductView(productCode: string): void {
  enqueue({ event_type: 'product_view', product_code: productCode });
  pushToDataLayer({ event: 'product_view', product_code: productCode, page_path: typeof window !== 'undefined' ? window.location.pathname : '' });
}

/** Affiliate link clicked */
export function trackAffiliateClick(productCode: string, platform: string, url: string, clickSource: string): void {
  enqueue({
    event_type: 'affiliate_click',
    product_code: productCode,
    affiliate_platform: platform,
    click_source: clickSource,
    metadata: { url },
  });
  pushToDataLayer({ event: 'affiliate_click', product_code: productCode, platform, url, click_source: clickSource });
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
