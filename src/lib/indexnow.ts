/**
 * IndexNow ping. Reads INDEXNOW_KEY from the environment.
 * If the key is missing, this returns without calling the network.
 * Do not commit a key. The public key file is served from middleware.
 */

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export async function notifyIndexNow(urls: string[]): Promise<number> {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key || urls.length === 0) return 0;

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
  let host = 'seenlio.com';
  try {
    host = new URL(site).host;
  } catch {
    return 0;
  }

  const clean: string[] = [];
  for (const raw of urls) {
    if (typeof raw !== 'string' || clean.length >= 100) continue;
    try {
      const url = new URL(raw, `https://${host}`);
      if (url.host !== host) continue;
      if (url.protocol !== 'https:') continue;
      clean.push(url.toString());
    } catch {
      continue;
    }
  }
  const unique = [...new Set(clean)];
  if (unique.length === 0) return 0;

  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: unique,
      }),
    });
  } catch {
    return 0;
  }
  return unique.length;
}
