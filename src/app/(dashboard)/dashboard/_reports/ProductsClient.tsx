'use client';

import BarChartH from '../_components/BarChartH';
import DataTable from '../_components/DataTable';

interface ProductsData {
  topViewed: Array<{ name: string; value: number }>;
  topClicked: Array<{ name: string; value: number }>;
  ctrTable: Array<{ name: string; views: number; clicks: number; ctr: number; platform: string }>;
}

const platformColors: Record<string, string> = {
  amazon: '#FF9900',
  aliexpress: '#E43225',
  temu: '#F26522',
  tiktok_shop: '#00F2EA',
};

const ctrColumns = [
  { key: 'name' as const, label: 'Product' },
  {
    key: 'platform' as const,
    label: 'Platform',
    render: (v: unknown) => {
      const p = String(v ?? '—');
      const color = platformColors[p];
      return (
        <span
          className='inline-block rounded-full px-2 py-0.5 text-xs font-medium'
          style={color ? { background: `${color}20`, color } : undefined}
        >
          {p}
        </span>
      );
    },
  },
  {
    key: 'views' as const,
    label: 'Views',
    align: 'right' as const,
    render: (v: unknown) => (v as number).toLocaleString(),
  },
  {
    key: 'clicks' as const,
    label: 'Clicks',
    align: 'right' as const,
    render: (v: unknown) => (v as number).toLocaleString(),
  },
  {
    key: 'ctr' as const,
    label: 'CTR',
    align: 'right' as const,
    render: (v: unknown) => (
      <span style={{ color: (v as number) > 5 ? 'var(--accent-cyan)' : 'var(--fg-secondary)' }}>
        {v as number}%
      </span>
    ),
  },
];

export default function ProductsClient({ data }: { data: ProductsData }) {
  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
            Top Viewed Products
          </h2>
          <BarChartH data={data.topViewed} color='#8b5cf6' label='Views' />
        </div>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
            Top Clicked Products
          </h2>
          <BarChartH data={data.topClicked} color='#06b6d4' label='Clicks' />
        </div>
      </div>

      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-6'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-4'>
          Product Performance — Views vs Clicks
        </h2>
        <DataTable
          columns={ctrColumns}
          data={data.ctrTable as unknown as Record<string, unknown>[]}
          defaultSort='views'
        />
      </div>
    </>
  );
}
