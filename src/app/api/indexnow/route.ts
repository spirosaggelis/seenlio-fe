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
 * At most 10,000 URLs per request. Same-host HTTPS URLs only.
 * indexnowSubmittedAt is updated by the scheduled sync, and only after HTTP 200 or 202.
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

  const result = await notifyIndexNow(urls);
  const accepted = result.status === 200 || result.status === 202;
  if (!accepted && !result.error) return new Response(null, { status: 204 });
  return Response.json(
    { ok: accepted, status: result.status, submitted: result.submitted.length, error: result.error ?? null },
    { status: accepted ? 200 : 502 },
  );
}
