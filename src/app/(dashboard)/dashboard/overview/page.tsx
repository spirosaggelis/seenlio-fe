import { Suspense } from 'react';
import KpiCard from '../_components/KpiCard';
import TimeSeriesChart from '../_components/TimeSeriesChart';
import DateRangePicker from '../_components/DateRangePicker';
import { getBaseUrl } from '@/lib/dashboard-api';

interface OverviewData {
  pageViews: number;
  sessions: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgDuration: number;
  timeseries: Array<{ date: string; value: number }>;
  deltas: { pageViews: number | null; sessions: number | null };
}

async function fetchOverview(from: string, to: string): Promise<OverviewData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/overview?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { pageViews: 0, sessions: 0, uniqueVisitors: 0, bounceRate: 0, avgDuration: 0, timeseries: [], deltas: { pageViews: null, sessions: null } };
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
  const from = params.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];

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
          Page Views Over Time
        </h2>
        <TimeSeriesChart data={data.timeseries} label='Page Views' color='#8b5cf6' />
      </div>
    </div>
  );
}
