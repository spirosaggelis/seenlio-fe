import { NextRequest, NextResponse } from 'next/server';
import { runListiclesCli } from '@/lib/listiclesRunner';

export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as {
    ids?: string[];
    top?: number;
  };

  const args = ['generate'];
  if (body.ids && body.ids.length > 0) {
    for (const id of body.ids) {
      args.push('--id', id);
    }
  } else {
    args.push('--top', String(body.top ?? 5));
  }

  const result = await runListiclesCli(args);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: 'generate failed',
        exitCode: result.exitCode,
        stderr: result.stderr.slice(-2000),
        stdout: result.stdout.slice(-2000),
      },
      { status: 500 },
    );
  }
  return NextResponse.json({
    ok: true,
    ...(result.parsed || {}),
    log: result.stderr.slice(-4000),
  });
}
