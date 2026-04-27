import TimeSeriesChart from '../_components/TimeSeriesChart';
import KpiCard from '../_components/KpiCard';
import { TopQueriesTable, ZeroResultsTable } from './SearchClient';
import { getBaseUrl } from '@/lib/dashboard-api';

interface SearchData {
  timeseries: Array<{ date: string; value: number }>;
  topQueries: Array<{ query: string; count: number; avgResults: number }>;
  zeroResults: Array<{ query: string; count: number; avgResults: number }>;
  totalSearches: number;
}

async function fetchSearch(from: string, to: string): Promise<SearchData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/search?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { timeseries: [], topQueries: [], zeroResults: [], totalSearches: 0 };
  return res.json();
}

export default async function SearchReport({ from, to }: { from: string; to: string }) {
  const data = await fetchSearch(from, to);

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
        <KpiCard label='Total Searches' value={data.totalSearches.toLocaleString()} accent='cyan' />
        <KpiCard label='Unique Queries' value={data.topQueries.length.toLocaleString()} accent='purple' />
        <KpiCard label='Zero-Result Queries' value={data.zeroResults.length.toLocaleString()} accent='pink' />
      </div>

      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Search Volume Over Time
        </h2>
        <TimeSeriesChart data={data.timeseries} label='Searches' color='#06b6d4' />
      </div>

      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Top Queries
        </h2>
        <TopQueriesTable data={data.topQueries} />
      </div>

      {data.zeroResults.length > 0 && (
        <div className='bg-[var(--bg-secondary)] border border-[var(--accent-pink)] border-opacity-30 rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold uppercase tracking-wider mb-1' style={{ color: 'var(--accent-pink)' }}>
            Zero-Result Queries
          </h2>
          <p className='text-xs text-[var(--fg-muted)] mb-4'>These searches returned no products — consider adding content for these terms</p>
          <ZeroResultsTable data={data.zeroResults} />
        </div>
      )}
    </div>
  );
}
