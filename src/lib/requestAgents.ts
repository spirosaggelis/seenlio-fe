/**
 * Crawlers and link-preview fetchers must not load GA4 or receive an
 * affiliate URL. Real browsers are not matched. Facebook, Instagram, and
 * WhatsApp in-app browsers are people and are excluded. A scraper that sends
 * a normal Chrome user agent is not matched.
 *
 * `bot` is a suffix (`Googlebot`), not a word, so it is not `\bbot\b`.
 * Cubot phones also end in "bot" and stay classified as people.
 */
export const NAMED_CRAWLER_SOURCE = [
  'facebookexternalhit',
  'meta-externalagent',
  'meta-externalfetcher',
  'embedly',
  'iframely',
  'quora link preview',
  'pinterest/0\\.',
  'slack-imgproxy',
  'bingpreview',
  'google-inspectiontool',
  'mediapartners-google',
  'feedfetcher-google',
  'apis-google',
  'googleother',
  'google-read-aloud',
  'bytespider',
  'chatgpt-user',
  'claude-user',
  'anthropic-ai',
  'ia_archiver',
  'vkshare',
  'skypeuripreview',
  'facebookcatalog',
  'headlesschrome',
  'phantomjs',
  'wget/',
  'curl/',
  'python-requests',
  'python-urllib',
  'scrapy',
  'go-http-client',
  'libwww',
  'okhttp',
  'node-fetch',
  'undici',
  'httpx/',
  'aiohttp',
  'line-poker',
  'snap url preview',
  'WhatsApp/[\\d.]+ A\\b',
  '^WhatsApp/',
].join('|');

export const GENERIC_CRAWLER_SOURCE = 'bot\\b|spider|crawler|\\bslurp\\b';

/** Device brands whose names end in "bot" and are not crawlers. */
export const DEVICE_ALLOW_SOURCE = 'cubot';

export const IN_APP_BROWSER_SOURCE = 'FBAN|FBAV|FB_IAB|FBIOS|Instagram';

const PREVIEW_TOKEN = /facebookexternalhit|facebot|meta-external/i;

function matches(source: string, userAgent: string): boolean {
  return new RegExp(source, 'i').test(userAgent);
}

/** Facebook, Instagram, and WhatsApp in-app browsers. Real people. */
export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  const ua = userAgent || '';
  if (PREVIEW_TOKEN.test(ua)) return false;
  if (matches(IN_APP_BROWSER_SOURCE, ua)) return true;
  return /Mozilla/i.test(ua)
    && /WhatsApp\/[\d.]+/i.test(ua)
    && !/WhatsApp\/[\d.]+ A\b/i.test(ua);
}

export function isCrawler(userAgent: string | null | undefined): boolean {
  const ua = (userAgent || '').trim();
  if (!ua) return true;
  if (isInAppBrowser(ua)) return false;
  if (matches(NAMED_CRAWLER_SOURCE, ua)) return true;
  if (matches(DEVICE_ALLOW_SOURCE, ua)) return false;
  return matches(GENERIC_CRAWLER_SOURCE, ua);
}

/** Same gate as `isCrawler`. Kept so existing call sites stay readable. */
export function isUntrackedAgent(userAgent: string | null | undefined): boolean {
  return isCrawler(userAgent);
}
