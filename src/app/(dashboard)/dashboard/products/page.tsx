import { Suspense } from 'react';
import DateRangePicker from '../_components/DateRangePicker';
import { getBaseUrl } from '@/lib/dashboard-api';
import ProductsClient from './ProductsClient';

interface ProductsData {
  topViewed: Array<{ name: string; value: number }>;
  topClicked: Array<{ name: string; value: number }>;
  ctrTable: Array<{ name: string; views: number; clicks: number; ctr: number }>;
}

async function fetchProducts(from: string, to: string): Promise<ProductsData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/products?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { topViewed: [], topClicked: [], ctrTable: [] };
  return res.json();
}

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const to = params.to ?? new Date().toISOString().split('T')[0];
  const now = new Date();
  const from = params.from ?? new Date(now.getTime() - 30 * 86_400_000).toISOString().split('T')[0];

  const data = await fetchProducts(from, to);

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Products</h1>
          <p className='text-sm text-[var(--fg-muted)] mt-1'>Product views, clicks, and CTR</p>
        </div>
        <Suspense>
          <DateRangePicker />
        </Suspense>
      </div>
      <ProductsClient data={data} />
    </div>
  );
}
