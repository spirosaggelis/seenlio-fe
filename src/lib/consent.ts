export type ConsentCategory = 'essential' | 'analytics' | 'marketing';

export interface ConsentPreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  adStorage: boolean;
  adUserData: boolean;
  adPersonalization: boolean;
  timestamp: number;
}

export const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  analytics: true,
  marketing: true,
  adStorage: true,
  adUserData: true,
  adPersonalization: true,
  timestamp: 0,
};

export const CONSENT_COOKIE = 'consent_preferences';
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getConsentFromCookie(): ConsentPreferences | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));

  if (!match) return null;

  try {
    const value = decodeURIComponent(match.split('=').slice(1).join('='));
    const parsed = JSON.parse(value);
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') {
      return null;
    }
    return {
      essential: true,
      analytics: parsed.analytics ?? true,
      marketing: parsed.marketing ?? true,
      adStorage: parsed.adStorage ?? parsed.marketing ?? true,
      adUserData: parsed.adUserData ?? parsed.marketing ?? true,
      adPersonalization: parsed.adPersonalization ?? parsed.marketing ?? true,
      timestamp: parsed.timestamp ?? 0,
    };
  } catch {
    return null;
  }
}

export function setConsentCookie(prefs: ConsentPreferences): void {
  if (typeof document === 'undefined') return;

  const value = encodeURIComponent(JSON.stringify(prefs));
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Strict`;
}
