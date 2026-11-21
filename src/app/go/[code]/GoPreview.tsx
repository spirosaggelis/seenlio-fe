import Image from 'next/image';
import Link from 'next/link';

/**
 * What a crawler receives instead of an affiliate hop.
 * This component has no destination prop, so the tagged retailer URL cannot
 * appear in the HTML, the Location header, or a client redirect.
 */
export default function GoPreview({
  productName,
  productCode,
  productImage,
  priceText,
  productHref,
}: {
  productName?: string;
  productCode: string;
  productImage: string | null;
  priceText: string | null;
  productHref: string;
}) {
  return (
    <div className='min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden'>
      <div className='relative z-10 flex flex-col items-center gap-6 px-4 w-full max-w-md'>
        <Image
          src='/logo.png'
          alt='Seenlio'
          width={140}
          height={42}
          className='h-9 w-auto opacity-75'
          priority
        />

        <div className='glass-card w-full px-6 py-7 text-center'>
          {(productImage || productName) && (
            <div className='flex items-center gap-4 mb-6 text-left'>
              {productImage && (
                <div className='relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10'>
                  <Image
                    src={productImage}
                    alt={productName || productCode}
                    fill
                    sizes='64px'
                    className='object-cover'
                  />
                </div>
              )}
              <div className='flex-1 min-w-0'>
                {productName && (
                  <p className='text-sm font-semibold text-white leading-snug line-clamp-2'>
                    {productName}
                  </p>
                )}
              </div>
            </div>
          )}

          {priceText && (
            <p className='text-2xl font-bold gradient-text mb-5'>{priceText}</p>
          )}

          <h1 className='text-base font-semibold text-white leading-snug mb-5'>
            {productName || 'This product'} on Seenlio
          </h1>

          <Link
            href={productHref}
            className='flex w-full items-center justify-center rounded-2xl bg-white/10 px-6 py-4 text-lg font-bold text-white'
          >
            View product
          </Link>
        </div>
      </div>
    </div>
  );
}
