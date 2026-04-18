import Link from 'next/link';
import { getProducts, PUBLISHED_PRODUCT_FILTER } from '@/lib/strapi';

interface PulseProduct {
  id: number;
  name: string;
  slug: string;
  trendScore?: number;
  pricePoints?: Array<{ price: number; currency?: string }>;
}

export default async function LivePulse() {
  let products: PulseProduct[] = [];
  try {
    const res = await getProducts({
      filters: { ...PUBLISHED_PRODUCT_FILTER },
      sort: ['trendScore:desc'],
      pagination: { pageSize: 14 },
      fields: ['id', 'name', 'slug', 'trendScore'],
      populate: { pricePoints: true },
    });
    products = (res.data || []) as PulseProduct[];
  } catch {
    return null;
  }

  if (products.length < 4) return null;

  // Duplicate so the marquee loops seamlessly (translateX -50%)
  const loop = [...products, ...products];

  return (
    <div className='mt-14 flex items-stretch rounded-2xl border border-white/10 bg-linear-to-r from-purple-500/[0.06] via-pink-500/[0.04] to-cyan-500/[0.06] overflow-hidden'>
      {/* fixed label sidebar */}
      <div className='shrink-0 flex items-center gap-2 px-4 bg-[#0a0a0f] border-r border-white/10 shadow-[4px_0_20px_-4px_rgba(236,72,153,0.3)]'>
        <span className='relative flex h-2 w-2'>
          <span className='absolute inset-0 animate-ping rounded-full bg-pink-400 opacity-75' />
          <span className='relative inline-flex h-2 w-2 rounded-full bg-pink-400' />
        </span>
        <span className='text-[10px] font-bold uppercase tracking-[0.15em] text-pink-200 whitespace-nowrap'>
          Live Pulse
        </span>
      </div>

      {/* scrolling marquee */}
      <div className='relative flex-1 min-w-0 overflow-hidden'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-[#0a0a0f] to-transparent z-[1]'
        />
        <div
          aria-hidden
          className='pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-[#0a0a0f] to-transparent z-[1]'
        />

        <div className='flex animate-marquee py-3 w-max'>
          {loop.map((p, idx) => {
            const score = Math.round(p.trendScore ?? 0);
            const price = p.pricePoints?.[0]?.price;
            return (
              <Link
                key={`${p.id}-${idx}`}
                href={`/products/${p.slug}`}
                className='group shrink-0 inline-flex items-center gap-2 mx-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-purple-400/40 transition-colors'
              >
                {score > 0 && (
                  <span className='inline-flex items-center justify-center min-w-[32px] text-[10px] font-mono font-bold text-orange-300 bg-orange-500/15 border border-orange-400/30 rounded-full px-1.5'>
                    {score}
                  </span>
                )}
                <span className='text-xs text-gray-200 group-hover:text-white transition-colors whitespace-nowrap max-w-[240px] truncate'>
                  {p.name}
                </span>
                {price !== undefined && (
                  <span className='text-[11px] font-semibold text-cyan-300'>
                    ${price.toFixed(2)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
