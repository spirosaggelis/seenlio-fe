import { NextRequest, NextResponse } from 'next/server';
import { runListiclesCli } from '@/lib/listiclesRunner';

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as { ids?: string[] };
  if (!body.ids || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const args = ['publish'];
  for (const id of body.ids) args.push('--id', id);

  const result = await runListiclesCli(args, 60_000);
  if (!result.ok) {
    return NextResponse.json(
      { error: 'publish failed', stderr: result.stderr.slice(-2000) },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, ...(result.parsed || {}) });
}
