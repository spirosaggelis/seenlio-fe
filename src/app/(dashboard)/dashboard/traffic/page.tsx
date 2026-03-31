import { Suspense } from 'react';
import TimeSeriesChart from '../_components/TimeSeriesChart';
import BarChartH from '../_components/BarChartH';
import DonutChart from '../_components/DonutChart';
import DateRangePicker from '../_components/DateRangePicker';
import { getBaseUrl } from '@/lib/dashboard-api';

interface TrafficData {
  timeseries: Array<{ date: string; value: number }>;
  topPages: Array<{ name: string; value: number }>;
  referrers: Array<{ name: string; value: number }>;
  devices: Array<{ name: string; value: number }>;
  countries: Array<{ name: string; value: number }>;
}

async function fetchTraffic(from: string, to: string): Promise<TrafficData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/traffic?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { timeseries: [], topPages: [], referrers: [], devices: [], countries: [] };
  return res.json();
}

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function TrafficPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const to = params.to ?? new Date().toISOString().split('T')[0];
  const now = new Date();
  const from = params.from ?? new Date(now.getTime() - 30 * 86_400_000).toISOString().split('T')[0];

  const data = await fetchTraffic(from, to);

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Traffic</h1>
          <p className='text-sm text-[var(--fg-muted)] mt-1'>Page views, sources, devices, countries</p>
        </div>
        <Suspense>
          <DateRangePicker />
        </Suspense>
      </div>

      {/* Time series */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Page Views Over Time
        </h2>
        <TimeSeriesChart data={data.timeseries} label='Page Views' color='#06b6d4' />
      </div>

      {/* Top pages */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Top Pages
        </h2>
        <BarChartH data={data.topPages} color='#8b5cf6' label='Views' />
      </div>

      {/* Referrers + devices */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
            Traffic Sources
          </h2>
          <DonutChart data={data.referrers} />
        </div>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
            Device Type
          </h2>
          <DonutChart
            data={data.devices}
            colors={['#06b6d4', '#8b5cf6', '#ec4899', '#10b981']}
          />
        </div>
      </div>

      {/* Countries */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Top Countries
        </h2>
        <BarChartH data={data.countries} color='#ec4899' label='Visitors' />
      </div>
    </div>
  );
}
