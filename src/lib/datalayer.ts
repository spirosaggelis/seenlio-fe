import type { ConsentPreferences } from './consent';
import { isAnalyticsDisabled } from '@/utils/analyticsDisable';

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
    ad_storage: prefs.adStorage ? 'granted' : 'denied',
    ad_user_data: prefs.adUserData ? 'granted' : 'denied',
    ad_personalization: prefs.adPersonalization ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  };
}

// ─── Event types ─────────────────────────────────────────────────────────────

export type DataLayerEvent =
  | { event: 'page_view'; page_path: string; page_title?: string }
  | { event: 'product_view'; product_code: string; page_path: string }
  | { event: 'affiliate_click'; product_code: string; platform: string; url: string; click_source: string }
  | { event: 'search'; query: string; results_count: number }
  | { event: 'category_browse'; category_slug: string }
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
  if (isAnalyticsDisabled()) return;
  if (window.location.pathname.startsWith('/dashboard')) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event as unknown as Record<string, unknown>);
}

/** Push a gtag consent update — this is what GTM reads for Consent Mode v2 */
export function updateGtagConsent(prefs: ConsentPreferences): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
   
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args as unknown as Record<string, unknown>);
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
