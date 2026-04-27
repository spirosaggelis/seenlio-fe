import { getBaseUrl } from '@/lib/dashboard-api';
import ProductsClient from './ProductsClient';

interface ProductsData {
  topViewed: Array<{ name: string; value: number }>;
  topClicked: Array<{ name: string; value: number }>;
  ctrTable: Array<{ name: string; views: number; clicks: number; ctr: number; platform: string }>;
}

async function fetchProducts(from: string, to: string): Promise<ProductsData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/products?from=${from}&to=${to}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { topViewed: [], topClicked: [], ctrTable: [] };
  return res.json();
}

export default async function ProductsReport({ from, to }: { from: string; to: string }) {
  const data = await fetchProducts(from, to);
  return (
    <div className='space-y-8'>
      <ProductsClient data={data} />
    </div>
  );
}
