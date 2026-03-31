import { Suspense } from 'react';
import DonutChart from '../_components/DonutChart';
import BarChartH from '../_components/BarChartH';
import TimeSeriesChart from '../_components/TimeSeriesChart';
import KpiCard from '../_components/KpiCard';
import DateRangePicker from '../_components/DateRangePicker';
import { getBaseUrl } from '@/lib/dashboard-api';

interface AffiliateData {
  total: number;
  byPlatform: Array<{ name: string; value: number }>;
  topProducts: Array<{ name: string; value: number }>;
  timeseries: Array<{ date: string; value: number }>;
}

async function fetchAffiliate(from: string, to: string): Promise<AffiliateData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/affiliate?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { total: 0, byPlatform: [], topProducts: [], timeseries: [] };
  return res.json();
}

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AffiliatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const to = params.to ?? new Date().toISOString().split('T')[0];
  const from = params.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];

  const data = await fetchAffiliate(from, to);

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Affiliate</h1>
          <p className='text-sm text-[var(--fg-muted)] mt-1'>Affiliate link clicks and conversions</p>
        </div>
        <Suspense>
          <DateRangePicker />
        </Suspense>
      </div>

      {/* KPI */}
      <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
        <KpiCard label='Total Clicks' value={data.total.toLocaleString()} accent='pink' />
        <KpiCard label='Platforms' value={data.byPlatform.length} accent='purple' />
        <KpiCard label='Products w/ Clicks' value={data.topProducts.length} accent='cyan' />
      </div>

      {/* Clicks over time */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Affiliate Clicks Over Time
        </h2>
        <TimeSeriesChart data={data.timeseries} label='Clicks' color='#ec4899' />
      </div>

      {/* Platform split + top products */}
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
            Top Products by Affiliate Clicks
          </h2>
          <BarChartH data={data.topProducts} color='#ec4899' label='Clicks' />
        </div>
      </div>
    </div>
  );
}
