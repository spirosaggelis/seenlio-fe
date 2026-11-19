import { notifyIndexNow } from '@/lib/indexnow';

/**
 * IndexNow submit hook.
 *
 * Set INDEXNOW_KEY to the key from Bing Webmaster / IndexNow. The same value
 * is served at `/{INDEXNOW_KEY}.txt`. If the variable is unset, this route
 * does nothing and does not invent a key.
 *
 * When a product, round-up, or category page is published, updated, or
 * removed, POST:
 *
 *   { "urls": ["https://seenlio.com/products/example-slug"] }
 *
 * Header: `x-indexnow-key: <INDEXNOW_KEY>`
 *
 * Include the public URL after an unpublish so crawlers recrawl the 404.
 * At most 100 URLs per request. Same-host HTTPS URLs only.
 */
export async function POST(req: Request) {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) return new Response(null, { status: 204 });

  const provided = req.headers.get('x-indexnow-key')?.trim();
  if (provided !== key) return new Response(null, { status: 401 });

  const body = await req.json().catch(() => null) as { urls?: unknown } | null;
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter((url): url is string => typeof url === 'string')
    : [];
  if (urls.length === 0) return new Response(null, { status: 204 });

  const submitted = await notifyIndexNow(urls);
  return Response.json({ ok: true, submitted });
}
