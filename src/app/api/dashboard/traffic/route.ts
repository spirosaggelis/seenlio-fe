import { NextRequest, NextResponse } from 'next/server';
import { parseDateRange } from '@/lib/dashboard-api';
import { ga4EventDateParams, isBqConfigured, runBqQuery } from '@/lib/bq/client';
import {
  formatBqEventDate,
  trafficCountriesSql,
  trafficDevicesSql,
  trafficReferrersSql,
  trafficTimeseriesSql,
  trafficTopPagesSql,
} from '@/lib/bq/siteAnalyticsQueries';

interface NamedRow {
  name: string | null;
  value: number | string | null;
}

interface TsRow {
  event_date: unknown;
  value: number | string | null;
}

interface PageRow {
  page_path: string | null;
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
      timeseries: [],
      topPages: [],
      referrers: [],
      devices: [],
      countries: [],
    });
  }

  try {
    const [timeseriesRaw, topPagesRaw, referrersRaw, devicesRaw, countriesRaw] = await Promise.all([
      runBqQuery<TsRow>(trafficTimeseriesSql(), params),
      runBqQuery<PageRow>(trafficTopPagesSql(), params),
      runBqQuery<NamedRow>(trafficReferrersSql(), params),
      runBqQuery<NamedRow>(trafficDevicesSql(), params),
      runBqQuery<NamedRow>(trafficCountriesSql(), params),
    ]);

    const timeseries = timeseriesRaw.map((r) => ({
      date: formatBqEventDate(r.event_date),
      value: num(r.value),
    }));

    const topPages = topPagesRaw.map((r) => ({
      name: r.page_path || '/',
      value: num(r.value),
    }));

    const mapNamed = (rows: NamedRow[]) =>
      rows.map((r) => ({ name: r.name || 'unknown', value: num(r.value) }));

    return NextResponse.json({
      timeseries,
      topPages,
      referrers: mapNamed(referrersRaw),
      devices: mapNamed(devicesRaw),
      countries: mapNamed(countriesRaw),
    });
  } catch (err) {
    console.error('[dashboard/traffic] BigQuery error:', err);
    return NextResponse.json({
      timeseries: [],
      topPages: [],
      referrers: [],
      devices: [],
      countries: [],
    });
  }
}
