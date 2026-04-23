import { NextRequest, NextResponse } from 'next/server';
import { parseDateRange } from '@/lib/dashboard-api';
import { ga4EventDateParams, isBqConfigured, runBqQuery } from '@/lib/bq/client';
import {
  affiliateByClickSourceSql,
  affiliateByPlatformSql,
  affiliateTimeseriesSql,
  affiliateTopProductsSql,
  formatBqEventDate,
} from '@/lib/bq/siteAnalyticsQueries';
import { getProductsByCodes } from '@/lib/strapi';

interface NamedRow {
  name: string | null;
  value: number | string | null;
}

interface TsRow {
  event_date: unknown;
  value: number | string | null;
}

interface CodeRow {
  item_code: string | null;
  value: number | string | null;
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { from, to } = parseDateRange(req.nextUrl.searchParams);
  const params = ga4EventDateParams(from, to);

  if (!isBqConfigured()) {
    return NextResponse.json({
      total: 0,
      byPlatform: [],
      bySource: [],
      topProducts: [],
      timeseries: [],
    });
  }

  try {
    const [byPlatformRaw, bySourceRaw, topCodesRaw, tsRaw] = await Promise.all([
      runBqQuery<NamedRow>(affiliateByPlatformSql(), params),
      runBqQuery<NamedRow>(affiliateByClickSourceSql(), params),
      runBqQuery<CodeRow>(affiliateTopProductsSql(), params),
      runBqQuery<TsRow>(affiliateTimeseriesSql(), params),
    ]);

    const byPlatform = byPlatformRaw.map((r) => ({
      name: r.name || 'unknown',
      value: num(r.value),
    }));
    const bySource = bySourceRaw.map((r) => ({
      name: r.name || 'unknown',
      value: num(r.value),
    }));

    const codes = topCodesRaw.map((r) => String(r.item_code ?? '')).filter(Boolean);
    let products: Record<string, unknown>[] = [];
    try {
      products = await getProductsByCodes(codes);
    } catch {
      /* Strapi optional for labels */
    }
    const byCode = new Map(
      products.map((p) => [String(p.productCode ?? '').toUpperCase(), p]),
    );

    const topProducts = topCodesRaw.map((r) => {
      const code = String(r.item_code ?? '');
      const p = byCode.get(code.toUpperCase());
      const name = (p?.name as string) || code || 'Unknown';
      return { name, value: num(r.value) };
    });

    const timeseries = tsRaw.map((r) => ({
      date: formatBqEventDate(r.event_date),
      value: num(r.value),
    }));

    const total = byPlatform.reduce((s, x) => s + x.value, 0);

    return NextResponse.json({
      total,
      byPlatform,
      bySource,
      topProducts,
      timeseries,
    });
  } catch (err) {
    console.error('[dashboard/affiliate] BigQuery error:', err);
    return NextResponse.json({
      total: 0,
      byPlatform: [],
      bySource: [],
      topProducts: [],
      timeseries: [],
    });
  }
}
