import { getBaseUrl } from '@/lib/dashboard-api';
import ManualClient from './ManualClient';

interface ManualProduct {
  id: string;
  name: string;
  productCode: string;
  productStatus: string;
  sourcePlatform: string;
  sourceUrl: string;
  externalId: string;
  videoState?: string;
  sitePublishedAt?: string | null;
  createdAt: string;
}

async function fetchInitial(): Promise<{
  products: ManualProduct[];
  categories: { id: string; name: string }[];
}> {
  const base = getBaseUrl();
  const [productsRes, pipelineRes] = await Promise.all([
    fetch(`${base}/api/dashboard/products/manual`, { cache: 'no-store' }),
    fetch(`${base}/api/dashboard/pipeline`, { cache: 'no-store' }),
  ]);
  const products = productsRes.ok ? (await productsRes.json()).products : [];
  const categories = pipelineRes.ok ? (await pipelineRes.json()).categories || [] : [];
  return { products, categories };
}

export default async function ManualPage() {
  const { products, categories } = await fetchInitial();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Manual Add</h1>
        <p className='text-sm text-[var(--fg-muted)] mt-1'>
          Submit a product URL from Amazon, AliExpress, or Temu. It will be scraped, auto-approved
          (no AI review), and run through the normal video + social publish flow on the next
          pipeline cycle. Manual products do not count toward pipeline targets.
        </p>
      </div>

      <ManualClient initialProducts={products} categories={categories} />
    </div>
  );
}
