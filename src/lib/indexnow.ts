/**
 * IndexNow ping. The key comes from INDEXNOW_KEY.
 * Middleware serves that same key at https://<host>/<key>.txt, and every
 * submission sends that URL as keyLocation.
 */

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10_000;

export type IndexNowResult = {
  status: number | null;
  submitted: string[];
  error?: string;
};

export type IndexNowContext = {
  key: string;
  host: string;
  origin: string;
  keyLocation: string;
};

export function indexNowContext(): IndexNowContext | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
  let host = 'seenlio.com';
  try {
    host = new URL(site).host;
  } catch {
    return null;
  }
  const origin = `https://${host}`;
  return { key, host, origin, keyLocation: `${origin}/${key}.txt` };
}

function safeText(text: string, key: string): string {
  return text.replaceAll(key, '[key]').slice(0, 300);
}

export async function notifyIndexNow(urls: string[]): Promise<IndexNowResult> {
  const ctx = indexNowContext();
  if (!ctx) {
    console.error('[indexnow] failed INDEXNOW_KEY is empty');
    return { status: null, submitted: [], error: 'INDEXNOW_KEY is empty' };
  }
  if (urls.length === 0) return { status: null, submitted: [] };

  const clean: string[] = [];
  for (const raw of urls) {
    if (typeof raw !== 'string') continue;
    try {
      const url = new URL(raw, ctx.origin);
      if (url.host !== ctx.host || url.protocol !== 'https:') continue;
      clean.push(url.toString());
    } catch {
      continue;
    }
  }
  const unique = [...new Set(clean)];
  if (unique.length === 0) return { status: null, submitted: [] };

  const submitted: string[] = [];
  let status: number | null = null;
  let error: string | undefined;

  for (let offset = 0; offset < unique.length; offset += MAX_URLS_PER_REQUEST) {
    const batch = unique.slice(offset, offset + MAX_URLS_PER_REQUEST);
    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: ctx.host,
          key: ctx.key,
          keyLocation: ctx.keyLocation,
          urlList: batch,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      status = res.status;
      if (res.status === 200 || res.status === 202) {
        submitted.push(...batch);
        console.info(
          `[indexnow] submitted ${batch.length} urls status=${res.status} sample=${batch[0]}`,
        );
      } else {
        const body = safeText(await res.text(), ctx.key);
        error = `status=${res.status} ${body}`.trim();
        console.error(`[indexnow] failed ${error}`);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'network error';
      console.error(`[indexnow] failed ${error}`);
    }
  }

  return { status, submitted, error };
}
