import { Suspense } from 'react';
import KpiCard from '../_components/KpiCard';
import TimeSeriesChart from '../_components/TimeSeriesChart';
import BarChartH from '../_components/BarChartH';
import DonutChart from '../_components/DonutChart';
import DateRangePicker from '../_components/DateRangePicker';
import { getBaseUrl } from '@/lib/dashboard-api';
import type { PivotRow } from '@/app/api/dashboard/social/route';
import SocialPivot from './SocialPivot';

interface SocialData {
  totals: Record<string, number>;
  byPlatform: Array<{ name: string; value: number }>;
  timeseries: Array<{ date: string; value: number }>;
  topVideos: Array<{ name: string; value: number }>;
  pivotRows: PivotRow[];
}

async function fetchSocial(from: string, to: string): Promise<SocialData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/social?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { totals: {}, byPlatform: [], timeseries: [], topVideos: [], pivotRows: [] };
  return res.json();
}

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function SocialPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const to = params.to ?? new Date().toISOString().split('T')[0];
  const now = new Date();
  const from = params.from ?? new Date(now.getTime() - 30 * 86_400_000).toISOString().split('T')[0];

  const data = await fetchSocial(from, to);
  const { totals } = data;

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Social Media</h1>
          <p className='text-sm text-[var(--fg-muted)] mt-1'>Performance across YouTube, TikTok, Instagram, Pinterest</p>
        </div>
        <Suspense>
          <DateRangePicker />
        </Suspense>
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <KpiCard label='Views' value={(totals.views ?? 0).toLocaleString()} accent='purple' />
        <KpiCard label='Likes' value={(totals.likes ?? 0).toLocaleString()} accent='pink' />
        <KpiCard label='Shares' value={(totals.shares ?? 0).toLocaleString()} accent='cyan' />
        <KpiCard label='Comments' value={(totals.comments ?? 0).toLocaleString()} accent='purple' />
      </div>

      {/* Views timeseries */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Views Over Time
        </h2>
        <TimeSeriesChart data={data.timeseries} label='Views' color='#8b5cf6' />
      </div>

      {/* Platform breakdown + top videos */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
            Views by Platform
          </h2>
          <DonutChart data={data.byPlatform} colors={['#ef4444', '#ec4899', '#a855f7', '#f97316']} />
        </div>

        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
            Top Videos by Views
          </h2>
          <BarChartH data={data.topVideos} color='#8b5cf6' label='Views' />
        </div>
      </div>

      {/* Pivot table */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <div className='mb-4'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
            Product × Platform × Channel
          </h2>
          <p className='text-xs text-[var(--fg-muted)] mt-1'>
            Drag columns to the row group panel to change grouping. Click headers to sort. Expand/collapse rows with the arrows.
          </p>
        </div>
        <SocialPivot rows={data.pivotRows} />
      </div>
    </div>
  );
}
