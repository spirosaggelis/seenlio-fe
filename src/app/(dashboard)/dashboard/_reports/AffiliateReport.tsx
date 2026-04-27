import DonutChart from '../_components/DonutChart';
import BarChartH from '../_components/BarChartH';
import TimeSeriesChart from '../_components/TimeSeriesChart';
import KpiCard from '../_components/KpiCard';
import { getBaseUrl } from '@/lib/dashboard-api';

interface AffiliateData {
  total: number;
  byPlatform: Array<{ name: string; value: number }>;
  bySource: Array<{ name: string; value: number }>;
  topProducts: Array<{ name: string; value: number }>;
  timeseries: Array<{ date: string; value: number }>;
}

async function fetchAffiliate(from: string, to: string): Promise<AffiliateData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/affiliate?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok)
    return { total: 0, byPlatform: [], bySource: [], topProducts: [], timeseries: [] };
  return res.json();
}

export default async function AffiliateReport({ from, to }: { from: string; to: string }) {
  const data = await fetchAffiliate(from, to);

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
        <KpiCard label='Total Clicks' value={data.total.toLocaleString()} accent='pink' />
        <KpiCard label='Platforms' value={data.byPlatform.length} accent='purple' />
        <KpiCard label='Products w/ Clicks' value={data.topProducts.length} accent='cyan' />
      </div>

      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Affiliate Clicks Over Time
        </h2>
        <TimeSeriesChart data={data.timeseries} label='Clicks' color='#ec4899' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
            Clicks by Platform
          </h2>
          <DonutChart
            data={data.byPlatform}
            colors={['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981']}
          />
        </div>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
            Clicks by Source
          </h2>
          <DonutChart
            data={data.bySource}
            colors={['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b']}
          />
        </div>
      </div>

      <div className='bg-(--bg-secondary) border border-(--border-subtle) rounded-md p-6'>
        <h2 className='text-sm font-semibold text-(--fg-secondary) uppercase tracking-wider mb-4'>
          Top Products by Affiliate Clicks
        </h2>
        <BarChartH data={data.topProducts} color='#ec4899' label='Clicks' />
      </div>
    </div>
  );
}
