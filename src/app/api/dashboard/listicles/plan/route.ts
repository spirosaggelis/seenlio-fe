import { NextRequest, NextResponse } from 'next/server';
import { runListiclesCli } from '@/lib/listiclesRunner';

export const maxDuration = 300; // 5 min — clustering + GPT-4o response

export async function POST(req: NextRequest): Promise<NextResponse> {
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';
  const args = ['plan', ...(dryRun ? ['--dry-run'] : [])];
  const result = await runListiclesCli(args);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: 'plan failed',
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
