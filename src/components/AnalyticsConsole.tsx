'use client';

import { useEffect } from 'react';
import {
  disableAnalytics,
  enableAnalytics,
  toggleAnalytics,
  getAnalyticsState,
  isAnalyticsDisabled,
} from '@/utils/analyticsDisable';

export default function AnalyticsConsole() {
  useEffect(() => {
    (window as unknown as Record<string, unknown>).analytics = {
      disable: disableAnalytics,
      enable: enableAnalytics,
      toggle: toggleAnalytics,
      status: getAnalyticsState,
      isDisabled: isAnalyticsDisabled,
    };
  }, []);

  return null;
}
