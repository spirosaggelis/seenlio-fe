'use client';

import { useConsent } from '@/providers/ConsentProvider';
import {
  trackProductView,
  trackProductClick,
  trackAffiliateClick,
  trackSearch,
  trackCategoryBrowse,
  trackFilterUse,
  trackEvent,
} from '@/lib/analytics';

export function useAnalytics() {
  const { preferences } = useConsent();

  return {
    trackProductView,
    trackProductClick,
    trackAffiliateClick,
    trackSearch,
    trackCategoryBrowse,
    trackFilterUse,
    trackEvent,
    consentGiven: preferences !== null,
    analyticsAllowed: preferences?.analytics ?? false,
    marketingAllowed: preferences?.marketing ?? false,
  };
}
