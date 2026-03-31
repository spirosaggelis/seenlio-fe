import type { ConsentPreferences } from './consent';

// ─── Consent state mapping ───────────────────────────────────────────────────

type ConsentStorage = {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  functionality_storage: 'granted' | 'denied';
  personalization_storage: 'granted' | 'denied';
};

export function consentToStorageState(prefs: ConsentPreferences): ConsentStorage {
  return {
    analytics_storage: 'granted', // always essential
    ad_storage: prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.marketing ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  };
}

// ─── Event types ─────────────────────────────────────────────────────────────

export type DataLayerEvent =
  | { event: 'page_view'; page_path: string; page_title?: string }
  | { event: 'product_view'; product_code: string; page_path: string }
  | { event: 'product_click'; product_code: string; page_path: string }
  | { event: 'affiliate_click'; product_code: string; platform: string; url: string }
  | { event: 'search'; query: string; results_count: number }
  | { event: 'category_browse'; category_slug: string }
  | { event: 'filter_use'; filters: Record<string, unknown>; page_path: string }
  | {
      event: 'cookie_consent';
      consent_action: 'accept_all' | 'reject_all' | 'save_custom';
      consent_source: 'banner' | 'cookie_page';
      [key: string]: unknown;
    };

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// ─── Push helpers ────────────────────────────────────────────────────────────

export function pushToDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event as unknown as Record<string, unknown>);
}

/** Push a gtag consent update — this is what GTM reads for Consent Mode v2 */
export function updateGtagConsent(prefs: ConsentPreferences): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments as unknown as Record<string, unknown>);
  }
  gtag('consent', 'update', consentToStorageState(prefs));
}

/** Push the cookie_consent event with full Consent Mode v2 properties */
export function pushConsentEvent(
  action: 'accept_all' | 'reject_all' | 'save_custom',
  source: 'banner' | 'cookie_page',
  prefs: ConsentPreferences,
): void {
  const storageState = consentToStorageState(prefs);
  pushToDataLayer({
    event: 'cookie_consent',
    consent_action: action,
    consent_source: source,
    ...storageState,
  });
}
