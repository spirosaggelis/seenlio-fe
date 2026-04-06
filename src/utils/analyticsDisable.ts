const DISABLE_ANALYTICS_KEY = 'disable_analytics';

export function isAnalyticsDisabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DISABLE_ANALYTICS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function disableAnalytics(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DISABLE_ANALYTICS_KEY, 'true');
    console.warn('Analytics disabled');
  } catch {
    console.warn('Failed to disable analytics');
  }
}

export function enableAnalytics(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DISABLE_ANALYTICS_KEY);
    console.warn('Analytics enabled');
  } catch {
    console.warn('Failed to enable analytics');
  }
}

export function toggleAnalytics(): boolean {
  if (isAnalyticsDisabled()) {
    enableAnalytics();
    return false;
  } else {
    disableAnalytics();
    return true;
  }
}

export function getAnalyticsState(): 'enabled' | 'disabled' {
  return isAnalyticsDisabled() ? 'disabled' : 'enabled';
}
