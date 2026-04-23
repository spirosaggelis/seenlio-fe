import { NextRequest, NextResponse } from 'next/server';
import { parseDateRange } from '@/lib/dashboard-api';
import { ga4EventDateParams, isBqConfigured, runBqQuery } from '@/lib/bq/client';
import {
  formatBqEventDate,
  overviewDailyMetricsSql,
  overviewKpisSql,
  overviewSourceMediumSql,
  overviewTrafficMediumSql,
  trafficReferrersSql,
} from '@/lib/bq/siteAnalyticsQueries';

interface KpiRow {
  page_views: number | string | null;
  sessions: number | string | null;
  unique_users: number | string | null;
  bounced_sessions: number | string | null;
}

interface DailyRow {
  event_date: unknown;
  page_views: number | string | null;
  unique_sessions: number | string | null;
  unique_users: number | string | null;
  product_views: number | string | null;
  affiliate_clicks: number | string | null;
}

interface NamedValueRow {
  name: string | null;
  value: number | string | null;
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { from, to } = parseDateRange(req.nextUrl.searchParams);

  const emptyTimeseries: Array<{
    date: string;
    pageViews: number;
    sessions: number;
    uniqueUsers: number;
    productViews: number;
    affiliateClicks: number;
  }> = [];

  const emptySources: Array<{ name: string; value: number }> = [];

  if (!isBqConfigured()) {
    return NextResponse.json({
      pageViews: 0,
      sessions: 0,
      uniqueVisitors: 0,
      bounceRate: 0,
      avgDuration: 0,
      timeseries: emptyTimeseries,
      deltas: { pageViews: null, sessions: null },
      trafficSources: emptySources,
      trafficMediums: emptySources,
      sourceMedium: emptySources,
    });
  }

  const rangeDays = Math.ceil(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - rangeDays);
  const prevFromStr = prevFrom.toISOString().split('T')[0];
  const prevToStr = prevTo.toISOString().split('T')[0];

  const params = ga4EventDateParams(from, to);
  const prevParams = ga4EventDateParams(prevFromStr, prevToStr);

  function mapNamed(rows: NamedValueRow[]): Array<{ name: string; value: number }> {
    return rows.map((r) => ({
      name: String(r.name ?? 'unknown'),
      value: num(r.value),
    }));
  }

  try {
    const [kpiRows, dailyRows, prevKpiRows, sourceRows, mediumRows, comboRows] = await Promise.all([
      runBqQuery<KpiRow>(overviewKpisSql(), params),
      runBqQuery<DailyRow>(overviewDailyMetricsSql(), params),
      runBqQuery<KpiRow>(overviewKpisSql(), prevParams),
      runBqQuery<NamedValueRow>(trafficReferrersSql(), params),
      runBqQuery<NamedValueRow>(overviewTrafficMediumSql(), params),
      runBqQuery<NamedValueRow>(overviewSourceMediumSql(), params),
    ]);

    const kpi = kpiRows[0];
    const pageViews = num(kpi?.page_views);
    const sessions = num(kpi?.sessions);
    const uniqueVisitors = num(kpi?.unique_users);
    const bounced = num(kpi?.bounced_sessions);
    const bounceRate = sessions > 0 ? Math.round((bounced / sessions) * 100) : 0;

    const timeseries = dailyRows.map((r) => ({
      date: formatBqEventDate(r.event_date),
      pageViews: num(r.page_views),
      sessions: num(r.unique_sessions),
      uniqueUsers: num(r.unique_users),
      productViews: num(r.product_views),
      affiliateClicks: num(r.affiliate_clicks),
    }));

    const prevKpi = prevKpiRows[0];
    const prevPageViews = num(prevKpi?.page_views);
    const prevSessions = num(prevKpi?.sessions);

    function delta(curr: number, prev: number): number | null {
      if (prev === 0) return null;
      return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
    }

    const trafficSources = mapNamed(sourceRows).slice(0, 10);
    const trafficMediums = mapNamed(mediumRows).slice(0, 10);
    const sourceMedium = mapNamed(comboRows);

    return NextResponse.json({
      pageViews,
      sessions,
      uniqueVisitors,
      bounceRate,
      avgDuration: 0,
      timeseries,
      deltas: {
        pageViews: delta(pageViews, prevPageViews),
        sessions: delta(sessions, prevSessions),
      },
      trafficSources,
      trafficMediums,
      sourceMedium,
    });
  } catch (err) {
    console.error('[dashboard/overview] BigQuery error:', err);
    return NextResponse.json(
      {
        pageViews: 0,
        sessions: 0,
        uniqueVisitors: 0,
        bounceRate: 0,
        avgDuration: 0,
        timeseries: emptyTimeseries,
        deltas: { pageViews: null, sessions: null },
        trafficSources: emptySources,
        trafficMediums: emptySources,
        sourceMedium: emptySources,
      },
      { status: 200 },
    );
  }
}
