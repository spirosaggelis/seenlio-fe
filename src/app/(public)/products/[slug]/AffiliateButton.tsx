'use client';

import { trackAffiliateClick } from '@/lib/analytics';

interface AffiliateButtonProps {
  href: string;
  platform: string;
  label: string;
  productCode: string;
  gradient: string;
  icon: string;
  clickSource?: string;
}

export default function AffiliateButton({
  href,
  platform,
  label,
  productCode,
  gradient,
  icon,
  clickSource = 'product_detail',
}: AffiliateButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackAffiliateClick(productCode, platform, href, clickSource)}
      data-product-code={productCode}
      data-platform={platform}
      className="group relative flex items-center justify-center gap-3 w-full rounded-xl px-6 py-4 font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
      <span className="relative text-lg">{icon}</span>
      <span className="relative">{label}</span>
      <svg
        className="relative w-5 h-5 transition-transform group-hover:translate-x-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  );
}
