import TimeSeriesChart from '../_components/TimeSeriesChart';
import BarChartH from '../_components/BarChartH';
import DonutChart from '../_components/DonutChart';
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

export default async function TrafficReport({ from, to }: { from: string; to: string }) {
  const data = await fetchTraffic(from, to);

  return (
    <div className='space-y-8'>
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Page Views Over Time
        </h2>
        <TimeSeriesChart data={data.timeseries} label='Page Views' color='#06b6d4' />
      </div>

      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Top Pages
        </h2>
        <BarChartH data={data.topPages} color='#8b5cf6' label='Views' />
      </div>

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
          <DonutChart data={data.devices} colors={['#06b6d4', '#8b5cf6', '#ec4899', '#10b981']} />
        </div>
      </div>

      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Top Countries
        </h2>
        <BarChartH data={data.countries} color='#ec4899' label='Visitors' />
      </div>
    </div>
  );
}
