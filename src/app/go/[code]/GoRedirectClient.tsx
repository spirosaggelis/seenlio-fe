'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { trackAffiliateRedirect, trackGoView, type GoTrackingFields } from '@/lib/analytics';

const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  temu: 'Temu',
  tiktok_shop: 'TikTok Shop',
  other: 'the store',
};

const SPLASH_MS = 700;
const IN_APP_MS = 250;

interface GoRedirectClientProps {
  destinationUrl: string;
  productCode: string;
  platform: string;
  productName?: string;
  productImage: string | null;
  priceText: string | null;
  seePrice: boolean;
  tracking: GoTrackingFields;
  /** In-app browsers skip the animation and leave immediately. */
  instant?: boolean;
}

export default function GoRedirectClient({
  destinationUrl,
  productCode,
  platform,
  productName,
  productImage,
  priceText,
  seePrice,
  tracking,
  instant = false,
}: GoRedirectClientProps) {
  const [leaving, setLeaving] = useState(false);
  const redirected = useRef(false);
  const trackingRef = useRef(tracking);
  trackingRef.current = tracking;
  const platformLabel = PLATFORM_LABELS[platform] || PLATFORM_LABELS.other;

  useEffect(() => {
    const fields = trackingRef.current;
    trackGoView(fields);
    if (!destinationUrl) return;

    const delay = instant ? IN_APP_MS : SPLASH_MS;
    const timer = setTimeout(() => {
      if (redirected.current) return;
      redirected.current = true;
      setLeaving(true);
      trackAffiliateRedirect(fields);
      window.location.assign(destinationUrl);
    }, delay);

    return () => clearTimeout(timer);
  }, [destinationUrl, instant]);

  function leaveNow() {
    if (!destinationUrl || redirected.current) return;
    redirected.current = true;
    setLeaving(true);
    trackAffiliateRedirect(tracking);
  }

  return (
    <div className='min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden'>
      <div className='absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px] animate-float pointer-events-none' />
      <div className='absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-float-delayed pointer-events-none' />

      <div className='relative z-10 flex flex-col items-center gap-6 px-4 w-full max-w-md animate-fade-in'>
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
                <p className='text-[11px] text-[var(--fg-muted)] uppercase tracking-wider mt-0.5'>
                  via {platformLabel}
                </p>
              </div>
            </div>
          )}

          {priceText && (
            <p className='text-2xl font-bold gradient-text mb-5'>{priceText}</p>
          )}
          {!priceText && seePrice && (
            <p className='text-lg font-semibold text-gray-300 mb-5'>See price</p>
          )}

          <h1 className='text-base font-semibold text-white leading-snug mb-5'>
            {destinationUrl ? (
              <>
                {leaving ? 'Taking you to ' : 'Opening '}
                <span className='gradient-text'>{platformLabel}</span>
              </>
            ) : (
              'This shop link is not available'
            )}
          </h1>

          {destinationUrl ? (
            <a
              href={destinationUrl}
              rel='nofollow sponsored noopener'
              onClick={leaveNow}
              className='flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-purple-500/30 transition-transform hover:scale-[1.02] active:scale-[0.98]'
            >
              Go to store
            </a>
          ) : (
            <a
              href='/products'
              className='flex w-full items-center justify-center rounded-2xl bg-white/10 px-6 py-4 text-lg font-bold text-white'
            >
              Back to products
            </a>
          )}

          {destinationUrl && !instant && (
            <p className='mt-4 text-xs text-[var(--fg-muted)]'>
              Continuing automatically…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
