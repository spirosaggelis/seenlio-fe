import { Metadata } from 'next';
import { getProducts } from '@/lib/strapi';
import ProductCard from '@/components/ProductCard';
import ProductGrid from '@/components/ProductGrid';

export const metadata: Metadata = {
  title: 'All Products',
  description:
    'Browse all trending products featured in viral videos. Sorted by trend score.',
};

interface MediaItem {
  url: string;
  type?: "image" | "video";
  isPrimary?: boolean;
  altText?: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  productCode: string;
  shortDescription?: string;
  trendScore?: number;
  rating?: number;
  reviewCount?: number;
  media?: MediaItem[];
  pricePoints?: Array<{
    price: number;
    currency?: string;
    originalPrice?: number;
  }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

export default async function ProductsPage() {
  let products: Product[] = [];

  try {
    const res = await getProducts({
      filters: { productStatus: { $eq: 'published' } },
      sort: ['trendScore:desc'],
      pagination: { pageSize: 24 },
    });
    products = (res.data || []) as Product[];
  } catch {
    // Strapi may not be running
  }

  return (
    <div className='min-h-screen bg-[#0a0a0f]'>
      <div className='mx-auto max-w-7xl px-4 py-16'>
        {/* Page header */}
        <div className='mb-12'>
          <h1 className='text-4xl sm:text-5xl font-extrabold tracking-tight'>
            <span className='bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent'>
              All Products
            </span>
          </h1>
          <div className='mt-4 flex items-center gap-3'>
            <p className='text-gray-400'>
              {products.length > 0
                ? `${products.length} products discovered`
                : 'Discovering products...'}
            </p>
            {products.length > 0 && (
              <span className='inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full'>
                <svg
                  className='w-3 h-3'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
                  />
                </svg>
                Sorted by trend score
              </span>
            )}
          </div>
          <div className='mt-4 h-px bg-linear-to-r from-purple-500/50 via-cyan-500/30 to-transparent' />
        </div>

        {/* Products */}
        <ProductGrid
          isEmpty={products.length === 0}
          emptyMessage='No products available yet'
        >
          {products.map((product, i) => {
            const primaryImage =
              product.media?.find((m) => m.isPrimary && m.type !== "video") ||
              product.media?.find((m) => m.type !== "video");
            return (
              <div
                key={product.id}
                className='opacity-0 animate-fade-in-up'
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                <ProductCard
                  name={product.name}
                  slug={product.slug}
                  productCode={product.productCode}
                  shortDescription={product.shortDescription}
                  imageUrl={primaryImage?.url}
                  pricePoints={product.pricePoints}
                  categories={product.categories}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  trendScore={product.trendScore}
                />
              </div>
            );
          })}
        </ProductGrid>
      </div>
    </div>
  );
}
