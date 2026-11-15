import { pushToDataLayer } from './datalayer';

// ─── Public API — GA4 via GTM / dataLayer only (BigQuery export is source of truth for reports) ─

/** Product page opened */
export function trackProductView(productCode: string): void {
  pushToDataLayer({
    event: 'product_view',
    product_code: productCode,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
  });
}

/**
 * Event-scoped GA4 custom dimensions for /go.
 * Register each parameter name in GA4 Admin → Custom definitions:
 * store, country, tag, product_code, source, channel.
 */
export interface GoTrackingFields {
  product_code: string;
  store: string;
  country: string;
  tag: string;
  source: string;
  channel: string;
}

/** /go opened by a person. Not fired for link-preview bots. */
export function trackGoView(fields: GoTrackingFields): void {
  pushToDataLayer({ event: 'go_view', ...fields });
}

/** The browser is actually leaving for the store. */
export function trackAffiliateRedirect(fields: GoTrackingFields): void {
  pushToDataLayer({ event: 'affiliate_redirect', ...fields });
}

/** Affiliate link clicked */
export function trackAffiliateClick(
  productCode: string,
  platform: string,
  url: string,
  clickSource: string,
): void {
  pushToDataLayer({
    event: 'affiliate_click',
    product_code: productCode,
    platform,
    url,
    click_source: clickSource,
  });
  // GA4 recommended event so it can be marked as a key event
  pushToDataLayer({
    event: 'generate_lead',
    product_code: productCode,
    platform,
    url,
    click_source: clickSource,
  });
}

/** Search submitted */
export function trackSearch(query: string, resultsCount: number): void {
  pushToDataLayer({ event: 'search', query, results_count: resultsCount });
}

/** Category page browsed */
export function trackCategoryBrowse(categorySlug: string): void {
  pushToDataLayer({ event: 'category_browse', category_slug: categorySlug });
}
