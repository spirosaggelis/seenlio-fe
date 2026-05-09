// Light-weight enrichment of an inbound request: parses User-Agent for device
// category + browser family, and reads Vercel/Cloudflare geo headers for
// city/region. Used on /go/* where GA4's native enrichment is unavailable
// (server-side Measurement Protocol does not fill geo.* / device.* fields).

export interface RequestGeo {
  country?: string;
  region?: string;
  city?: string;
}

export interface RequestDevice {
  category: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
}

const MOBILE_RE = /Mobile|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|webOS|IEMobile|Opera Mini/i;
const TABLET_RE = /iPad|Android(?!.*Mobile)|Tablet/i;

export function parseDevice(ua: string): RequestDevice {
  if (!ua) return { category: 'desktop' };

  let category: RequestDevice['category'] = 'desktop';
  if (TABLET_RE.test(ua)) category = 'tablet';
  else if (MOBILE_RE.test(ua)) category = 'mobile';

  let browser: string | undefined;
  if (/FBAN|FBAV|FB_IAB/.test(ua)) browser = 'Facebook In-App';
  else if (/Instagram/.test(ua)) browser = 'Instagram In-App';
  else if (/TikTok/.test(ua)) browser = 'TikTok In-App';
  else if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';

  let os: string | undefined;
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  return { category, browser, os };
}

export function readGeoHeaders(get: (name: string) => string | null): RequestGeo {
  const country =
    (get('x-vercel-ip-country') || get('cf-ipcountry') || '').trim().toUpperCase() ||
    undefined;
  const region =
    (get('x-vercel-ip-country-region') || get('cf-region-code') || '').trim() ||
    undefined;
  // Vercel city header is URL-encoded (e.g. "Athens", "San%20Francisco").
  const cityRaw = get('x-vercel-ip-city') || get('cf-ipcity') || '';
  const city = cityRaw ? decodeURIComponent(cityRaw).trim() : undefined;
  return { country, region, city };
}
