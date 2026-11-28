import { runIndexNowSync } from '@/lib/indexnowSync';

export const dynamic = 'force-dynamic';

/**
 * One IndexNow pass: content changes, new guides and categories, and
 * unpublished products. Header `x-indexnow-key` must match INDEXNOW_KEY.
 */
export async function POST(req: Request) {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return Response.json({ ok: false, error: 'INDEXNOW_KEY is empty' }, { status: 503 });
  }
  if (req.headers.get('x-indexnow-key')?.trim() !== key) {
    return new Response(null, { status: 401 });
  }

  const result = await runIndexNowSync();
  const accepted = result.status === 200 || result.status === 202;
  return Response.json(
    {
      ok: accepted || (result.submitted.length === 0 && !result.error),
      status: result.status,
      submitted: result.submitted.length,
      sample: result.submitted[0] ?? null,
      stamped: result.stamped,
      error: result.error ?? null,
    },
    { status: result.error && result.submitted.length === 0 ? 502 : 200 },
  );
}
