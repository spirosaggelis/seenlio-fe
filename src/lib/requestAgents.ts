/**
 * Agents that must not send GA4 hits.
 * Only crawlers that name themselves. The Singapore scraper uses a normal
 * Chrome user agent, so it is not matched here.
 */
export const UNTRACKED_AGENT_SOURCE =
  'facebookexternalhit|meta-externalagent|meta-externalfetcher|facebot';

export function isUntrackedAgent(userAgent: string | null | undefined): boolean {
  const ua = userAgent || '';
  return new RegExp(UNTRACKED_AGENT_SOURCE, 'i').test(ua);
}

/** Facebook and Instagram in-app browsers. Real people, but the splash blocks them. */
export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  const ua = userAgent || '';
  if (isUntrackedAgent(ua)) return false;
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram/i.test(ua);
}

const SPLASH_BOT =
  /bot|spider|crawler|preview|slurp|facebookexternalhit|meta-external|facebot|slackbot|whatsapp|telegrambot|pinterestbot|bytespider|petalbot|curl\/|wget\/|python-requests|headless/i;

/** Skip the /go splash for in-app browsers and for bots. */
export function shouldSkipSplash(userAgent: string | null | undefined): boolean {
  const ua = userAgent || '';
  return isInAppBrowser(ua) || SPLASH_BOT.test(ua) || isUntrackedAgent(ua);
}
