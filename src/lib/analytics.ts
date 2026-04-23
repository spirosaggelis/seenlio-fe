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
}

/** Search submitted */
export function trackSearch(query: string, resultsCount: number): void {
  pushToDataLayer({ event: 'search', query, results_count: resultsCount });
}

/** Category page browsed */
export function trackCategoryBrowse(categorySlug: string): void {
  pushToDataLayer({ event: 'category_browse', category_slug: categorySlug });
}
