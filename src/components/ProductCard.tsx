import Image from 'next/image';
import Link from 'next/link';
import TrendBadge from './TrendBadge';
import PriceDisplay from './PriceDisplay';
import StarRating from './StarRating';
import ListingCtaButton from './ListingCtaButton';

interface PricePoint {
  price: number;
  currency?: string;
  originalPrice?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  isActive?: boolean;
}

interface ProductCardProps {
  name: string;
  slug: string;
  productCode: string;
  sourcePlatform?: string;
  shortDescription?: string;
  imageUrl?: string;
  pricePoints?: PricePoint[];
  categories?: Category[];
  rating?: number;
  reviewCount?: number;
  trendScore?: number;
}

export default function ProductCard({
  name,
  slug,
  productCode,
  sourcePlatform,
  shortDescription,
  imageUrl,
  pricePoints,
  categories,
  rating,
  reviewCount,
  trendScore,
}: ProductCardProps) {
  const price = pricePoints?.[0];

  return (
    <div className='group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/40 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]'>
      {/* Stretched link covers entire card (below CTA button) */}
      <Link href={`/products/${slug}`} className='absolute inset-0 z-0' aria-label={name} />

      {/* Image */}
      <div className='relative z-10 overflow-hidden bg-linear-to-br from-purple-900/20 via-gray-900 to-cyan-900/20' style={{ paddingBottom: '75%' }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            loading='lazy'
          />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center'>
              <svg className='w-8 h-8 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5} aria-hidden='true'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z' />
              </svg>
            </div>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className='absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#0a0a0f] to-transparent' />

        {/* Trend badge */}
        {trendScore !== undefined && trendScore > 0 && (
          <div className='absolute top-3 right-3'>
            <TrendBadge score={trendScore} size='sm' />
          </div>
        )}
      </div>

      {/* Content */}
      <div className='relative z-10 flex flex-col flex-1 p-4 gap-2'>
        {/* Name */}
        <h3 className='font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-200 transition-colors'>
          {name}
        </h3>

        {/* Description */}
        {shortDescription && (
          <p className='text-sm text-gray-400 line-clamp-2 leading-relaxed'>
            {shortDescription}
          </p>
        )}

        {/* Rating */}
        {rating !== undefined && rating > 0 && (
          <StarRating rating={rating} reviewCount={reviewCount} compact />
        )}

        {/* Spacer */}
        <div className='flex-1' />

        {/* Category tags */}
        {categories && categories.filter((c) => c.isActive !== false).length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {categories.filter((c) => c.isActive !== false).slice(0, 2).map((cat) => (
              <span key={cat.id} className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 truncate'>
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Price + product code on same row */}
        <div className='flex items-center justify-between gap-2'>
          {price ? (
            <PriceDisplay
              price={price.price}
              originalPrice={price.originalPrice}
              currency={price.currency === 'USD' ? '$' : price.currency || '$'}
              size='sm'
            />
          ) : <div />}
          <span className='shrink-0 text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded'>
            {productCode}
          </span>
        </div>

        {/* CTA */}
        <ListingCtaButton productCode={productCode} platform={sourcePlatform || 'amazon'} />
      </div>
    </div>
  );
}
