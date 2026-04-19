'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { isAnalyticsDisabled } from '@/utils/analyticsDisable';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Renders Google Tag Manager scripts only on public pages.
 * Dashboard routes (/dashboard/**) are excluded to keep
 * admin traffic out of analytics.
 */
export default function GtmScript() {
  const pathname = usePathname();
  const injected = useRef(false);

  useEffect(() => {
    if (!GTM_ID) return;
    if (pathname.startsWith('/dashboard')) return;
    if (isAnalyticsDisabled()) return;
    if (injected.current) return;
    injected.current = true;

    // Consent Mode v2 defaults
    const w = window as typeof window & { dataLayer: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    function gtag(...args: unknown[]) {
      w.dataLayer.push(args as unknown as Record<string, unknown>);
    }
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
    });

    // GTM snippet
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(script);
  }, [pathname]);

  return null;
}

