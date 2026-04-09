'use client';

import Link from 'next/link';
import { trackAffiliateClick } from '@/lib/analytics';

interface Props {
  productCode: string;
  platform: string;
}

export default function ListingCtaButton({ productCode, platform }: Props) {
  return (
    <Link
      href={`/go/${productCode}`}
      onClick={() => trackAffiliateClick(productCode, platform, `/go/${productCode}`, 'listing')}
      className='relative z-10 mt-2 group flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]'
    >
      <div className='absolute inset-0 bg-linear-to-r from-purple-600 to-pink-600' />
      <div className='absolute inset-0 bg-linear-to-r from-purple-600 to-pink-600 blur-xl opacity-30 group-hover:opacity-50 transition-opacity' />
      <span className='relative text-sm'>🛒</span>
      <span className='relative text-sm'>Shop Now</span>
      <svg className='relative w-4 h-4 transition-transform group-hover:translate-x-0.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25' />
      </svg>
    </Link>
  );
}
