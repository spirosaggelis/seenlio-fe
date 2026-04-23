import { NextRequest, NextResponse } from 'next/server';
import { parseDateRange } from '@/lib/dashboard-api';
import { ga4EventDateParams, isBqConfigured, runBqQuery } from '@/lib/bq/client';
import { productClicksByCodeSql, productViewsByCodeSql } from '@/lib/bq/siteAnalyticsQueries';
import { getProductsByCodes } from '@/lib/strapi';

interface ViewsRow {
  item_code: string | null;
  views: number | string | null;
}

interface ClicksRow {
  item_code: string | null;
  clicks: number | string | null;
  affiliate_platform: string | null;
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
    return NextResponse.json({ topViewed: [], topClicked: [], ctrTable: [] });
  }

  try {
    const [viewRows, clickRows] = await Promise.all([
      runBqQuery<ViewsRow>(productViewsByCodeSql(), params),
      runBqQuery<ClicksRow>(productClicksByCodeSql(), params),
    ]);

    const viewsMap = new Map<string, number>();
    for (const r of viewRows) {
      const c = String(r.item_code ?? '').trim().toUpperCase();
      if (!c) continue;
      viewsMap.set(c, num(r.views));
    }

    const clicksMap = new Map<string, { clicks: number; platform: string }>();
    for (const r of clickRows) {
      const c = String(r.item_code ?? '').trim().toUpperCase();
      if (!c) continue;
      clicksMap.set(c, {
        clicks: num(r.clicks),
        platform: String(r.affiliate_platform ?? '').trim() || '—',
      });
    }

    const allCodes = [...new Set([...viewsMap.keys(), ...clicksMap.keys()])];

    let products: Record<string, unknown>[] = [];
    try {
      products = await getProductsByCodes(allCodes);
    } catch {
      /* names fall back to codes */
    }
    const byCode = new Map(
      products.map((p) => [String(p.productCode ?? '').trim().toUpperCase(), p]),
    );

    function label(code: string): { name: string; slug: string; platform: string } {
      const p = byCode.get(code);
      return {
        name: (p?.name as string) || code,
        slug: (p?.slug as string) || '',
        platform: (p?.sourcePlatform as string) || '—',
      };
    }

    const ctrTable = allCodes
      .map((code) => {
        const meta = label(code);
        const views = viewsMap.get(code) ?? 0;
        const ck = clicksMap.get(code);
        const clicks = ck?.clicks ?? 0;
        const platform = ck?.platform && ck.platform !== '—' ? ck.platform : meta.platform;
        return {
          name: meta.name,
          views,
          clicks,
          platform: platform || '—',
          ctr: views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 50);

    const topViewed = [...viewsMap.entries()]
      .map(([code, value]) => ({ name: label(code).name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topClicked = [...clicksMap.entries()]
      .map(([code, data]) => ({ name: label(code).name, value: data.clicks }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return NextResponse.json({ topViewed, topClicked, ctrTable });
  } catch (err) {
    console.error('[dashboard/products] BigQuery error:', err);
    return NextResponse.json({ topViewed: [], topClicked: [], ctrTable: [] });
  }
}
