'use client';

import { useConsent } from '@/providers/ConsentProvider';
import {
  trackProductView,
  trackAffiliateClick,
  trackSearch,
  trackCategoryBrowse,
} from '@/lib/analytics';

export function useAnalytics() {
  const { preferences } = useConsent();

  return {
    trackProductView,
    trackAffiliateClick,
    trackSearch,
    trackCategoryBrowse,
    consentGiven: preferences !== null,
    analyticsAllowed: preferences?.analytics ?? false,
    marketingAllowed: preferences?.marketing ?? false,
  };
}
