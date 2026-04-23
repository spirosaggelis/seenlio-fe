import { ga4EventDateParams, isBqConfigured, runBqQuery } from '@/lib/bq/client';
import { pageViewsTotalSql } from '@/lib/bq/siteAnalyticsQueries';

interface TotalRow {
  total: number | string | null;
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Page views in the last `days` (server-side BigQuery — avoids self-fetch / wrong PORT). */
export async function getRollingPageViewCount(days: number): Promise<number> {
  if (!isBqConfigured()) return 0;
  const d = Math.min(3650, Math.max(1, days));
  const end = new Date();
  const start = new Date(end.getTime() - d * 86_400_000);
  try {
    const rows = await runBqQuery<TotalRow>(
      pageViewsTotalSql(),
      ga4EventDateParams(isoDate(start), isoDate(end)),
    );
    return num(rows[0]?.total);
  } catch (err) {
    console.error('[bq] getRollingPageViewCount:', err);
    return 0;
  }
}
