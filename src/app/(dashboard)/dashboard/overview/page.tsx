import { Suspense } from 'react';
import KpiCard from '../_components/KpiCard';
import OverviewMetricsChart, {
  type OverviewMetricsPoint,
} from '../_components/OverviewMetricsChart';
import DonutChart from '../_components/DonutChart';
import BarChartH from '../_components/BarChartH';
import DateRangePicker from '../_components/DateRangePicker';
import { getBaseUrl } from '@/lib/dashboard-api';

interface SourceSlice {
  name: string;
  value: number;
}

interface OverviewData {
  pageViews: number;
  sessions: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgDuration: number;
  timeseries: OverviewMetricsPoint[];
  deltas: { pageViews: number | null; sessions: number | null };
  trafficSources: SourceSlice[];
  trafficMediums: SourceSlice[];
  sourceMedium: SourceSlice[];
}

async function fetchOverview(from: string, to: string): Promise<OverviewData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/overview?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  const emptySources: SourceSlice[] = [];
  if (!res.ok)
    return {
      pageViews: 0,
      sessions: 0,
      uniqueVisitors: 0,
      bounceRate: 0,
      avgDuration: 0,
      timeseries: [],
      deltas: { pageViews: null, sessions: null },
      trafficSources: emptySources,
      trafficMediums: emptySources,
      sourceMedium: emptySources,
    };
  return res.json();
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function OverviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const to = params.to ?? new Date().toISOString().split('T')[0];
  const now = new Date();
  const from = params.from ?? new Date(now.getTime() - 30 * 86_400_000).toISOString().split('T')[0];

  const data = await fetchOverview(from, to);

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Overview</h1>
          <p className='text-sm text-[var(--fg-muted)] mt-1'>Site-wide performance summary</p>
        </div>
        <Suspense>
          <DateRangePicker />
        </Suspense>
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-2 lg:grid-cols-5 gap-4'>
        <KpiCard
          label='Page Views'
          value={data.pageViews.toLocaleString()}
          delta={data.deltas.pageViews ?? undefined}
          accent='purple'
        />
        <KpiCard
          label='Sessions'
          value={data.sessions.toLocaleString()}
          delta={data.deltas.sessions ?? undefined}
          accent='cyan'
        />
        <KpiCard
          label='Unique Visitors'
          value={data.uniqueVisitors.toLocaleString()}
          accent='pink'
        />
        <KpiCard
          label='Bounce Rate'
          value={`${data.bounceRate}%`}
          accent='purple'
        />
        <KpiCard
          label='Avg. Duration'
          value={formatDuration(data.avgDuration)}
          accent='cyan'
        />
      </div>

      {/* Time series */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Traffic over time
        </h2>
        <p className='text-xs text-[var(--fg-muted)] mb-4'>
          Page views, sessions, distinct users per day, product views (view_item), and affiliate clicks.
        </p>
        <OverviewMetricsChart data={data.timeseries} />
      </div>

      {/* Acquisition: sources & mediums (GA4 traffic_source on page_view) */}
      <div className='space-y-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
          Where traffic comes from
        </h2>
        <p className='text-xs text-[var(--fg-muted)] -mt-2'>
          Distinct users by default channel source and medium for the selected range (same as GA4
          traffic acquisition).
        </p>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
            <h3 className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-4'>
              Top sources
            </h3>
            {data.trafficSources.length > 0 ? (
              <DonutChart data={data.trafficSources} />
            ) : (
              <p className='text-sm text-[var(--fg-muted)] py-12 text-center'>No source data for this range.</p>
            )}
          </div>
          <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
            <h3 className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-4'>
              Top mediums
            </h3>
            {data.trafficMediums.length > 0 ? (
              <DonutChart
                data={data.trafficMediums}
                colors={['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#a78bfa', '#fb923c']}
              />
            ) : (
              <p className='text-sm text-[var(--fg-muted)] py-12 text-center'>No medium data for this range.</p>
            )}
          </div>
        </div>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h3 className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-4'>
            Source / medium (top combinations)
          </h3>
          {data.sourceMedium.length > 0 ? (
            <BarChartH data={data.sourceMedium} color='#8b5cf6' label='Users' maxItems={14} />
          ) : (
            <p className='text-sm text-[var(--fg-muted)] py-8 text-center'>No source/medium combinations for this range.</p>
          )}
        </div>
      </div>
    </div>
  );
}
