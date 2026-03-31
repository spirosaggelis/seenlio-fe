'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface StickyCtaBarProps {
  buttons: Array<{
    platform: string;
    href: string;
    label: string;
    gradient: string;
    icon: string;
  }>;
  productCode: string;
  price?: { price: number; currency: string; originalPrice?: number };
  productName: string;
  imageUrl?: string;
}

export default function StickyCtaBar({ buttons, productCode, price, productName, imageUrl }: StickyCtaBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById('cta-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (buttons.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-[#12121a]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-purple-500/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          {/* Product info */}
          <div className="hidden sm:flex items-center gap-3 min-w-0 flex-1">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={productName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{productName}</p>
              {price && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-emerald-400">
                    {price.currency === 'USD' ? '$' : price.currency}
                    {price.price.toFixed(2)}
                  </span>
                  {price.originalPrice && price.originalPrice > price.price && (
                    <span className="text-sm text-gray-500 line-through">
                      ${price.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {buttons.slice(0, 2).map((btn, i) => (
              <a
                key={i}
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                data-product-code={productCode}
                data-platform={btn.platform}
                className={`relative flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 ${
                  i === 0 ? 'text-base' : 'text-sm'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${btn.gradient}`} />
                <span className="relative">{btn.icon}</span>
                <span className="relative whitespace-nowrap">{btn.label}</span>
                <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
