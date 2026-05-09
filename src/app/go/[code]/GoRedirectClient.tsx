'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { trackAffiliateClick } from '@/lib/analytics';

const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  temu: 'Temu',
  tiktok_shop: 'TikTok Shop',
  other: 'the store',
};

const COUNTRY_NAMES: Record<string, string> = {
  GR: 'Greece',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  PT: 'Portugal',
  GB: 'United Kingdom',
  IE: 'Ireland',
  NL: 'Netherlands',
  BE: 'Belgium',
  AT: 'Austria',
  CH: 'Switzerland',
  US: 'United States',
  CA: 'Canada',
};

const STEPS = [
  { label: 'Finding best deal', duration: 1000 },
  { label: 'Checking your region', duration: 1000 },
  { label: 'Selecting regional store', duration: 1000 },
  { label: 'Preparing secure link', duration: 1000 },
];

const TOTAL_DELAY_MS = STEPS.reduce((s, st) => s + st.duration, 0); // 4000ms

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

interface GoRedirectClientProps {
  destinationUrl: string;
  productCode: string;
  platform: string;
  productName?: string;
  productImage: string | null;
  price: number | null;
  originalPrice: number | null;
  currency: string | null;
  country: string;
}

export default function GoRedirectClient({
  destinationUrl,
  productCode,
  platform,
  productName,
  productImage,
  price,
  originalPrice,
  currency,
  country,
}: GoRedirectClientProps) {
  const [step, setStep] = useState(0); // current active step index (STEPS.length = all done)
  const linkRef = useRef<HTMLAnchorElement>(null);

  const platformLabel = PLATFORM_LABELS[platform] || PLATFORM_LABELS.other;
  const countryLabel = COUNTRY_NAMES[country] || country || 'your region';
  const currencySymbol =
    (currency && CURRENCY_SYMBOLS[currency]) || currency || '';

  const hasDiscount =
    price != null && originalPrice != null && originalPrice > price;
  const savingsPct = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  useEffect(() => {
    // Fire dataLayer event ASAP so GTM/GA4 has the maximum amount of time to
    // load, evaluate triggers, and beacon the event before navigation.
    trackAffiliateClick(productCode, platform, destinationUrl, 'short_url');

    // Schedule step transitions.
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    STEPS.forEach((s, i) => {
      elapsed += s.duration;
      timers.push(setTimeout(() => setStep(i + 1), elapsed));
    });

    // Trigger the redirect by clicking a real <a> element. Browsers grant
    // navigations triggered by user-agent click events more time to flush
    // in-flight beacons (sendBeacon) than scripted `window.location.href`.
    timers.push(
      setTimeout(() => {
        const a = linkRef.current;
        if (a) a.click();
        else window.location.href = destinationUrl;
      }, TOTAL_DELAY_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, [destinationUrl, productCode, platform]);

  const allDone = step >= STEPS.length;

  return (
    <div className='min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden'>
      {/* Gradient orbs */}
      <div className='absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px] animate-float pointer-events-none' />
      <div className='absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-float-delayed pointer-events-none' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-pink-500/5 rounded-full blur-[140px] pointer-events-none' />

      {/* Subtle grid */}
      <div
        className='absolute inset-0 opacity-[0.025] pointer-events-none'
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Hidden anchor used as the actual redirect trigger */}
      <a
        ref={linkRef}
        href={destinationUrl}
        rel='nofollow sponsored noopener'
        className='sr-only'
        aria-hidden='true'
        tabIndex={-1}
      >
        Continue
      </a>

      <div className='relative z-10 flex flex-col items-center gap-6 px-4 w-full max-w-md animate-fade-in'>
        {/* Logo */}
        <Image
          src='/logo.png'
          alt='Seenlio'
          width={140}
          height={42}
          className='h-9 w-auto opacity-75'
          priority
        />

        {/* Card */}
        <div className='glass-card w-full px-6 py-7 text-center'>
          {/* Product preview */}
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

          {/* Price block */}
          {price != null && (
            <div className='flex items-baseline justify-center gap-3 mb-5'>
              <span className='text-2xl font-bold gradient-text'>
                {currencySymbol}
                {price.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className='text-sm text-[var(--fg-faint)] line-through'>
                    {currencySymbol}
                    {originalPrice!.toFixed(2)}
                  </span>
                  <span className='text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full'>
                    -{savingsPct}%
                  </span>
                </>
              )}
            </div>
          )}

          {/* Headline */}
          <h1 className='text-base font-semibold text-white leading-snug mb-1'>
            {allDone ? (
              <>
                Taking you to{' '}
                <span className='gradient-text'>{platformLabel}</span>
              </>
            ) : (
              <>
                Finding the best deal in{' '}
                <span className='gradient-text'>{countryLabel}</span>
              </>
            )}
          </h1>
          <p className='text-xs text-[var(--fg-muted)] mb-6'>
            We check multiple stores so you don&apos;t have to.
          </p>

          {/* Steps */}
          <div className='space-y-3 text-left'>
            {STEPS.map((s, i) => {
              const isDone = i < step;
              const isActive = i === step && !allDone;
              const isPending = i > step;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    isPending ? 'opacity-25' : 'opacity-100'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isDone
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500'
                        : isActive
                          ? 'border-2 border-purple-400 bg-purple-500/15'
                          : 'border-2 border-white/10'
                    }`}
                  >
                    {isDone && (
                      <svg
                        className='w-2.5 h-2.5 text-white'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                        strokeWidth={3.5}
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    )}
                    {isActive && (
                      <span className='w-2 h-2 rounded-full bg-purple-400 animate-ping block' />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isDone || isActive
                        ? 'text-[var(--fg-primary)]'
                        : 'text-[var(--fg-faint)]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skip link */}
        <a
          href={destinationUrl}
          rel='nofollow sponsored noopener'
          className='text-xs text-[var(--fg-faint)] hover:text-[var(--fg-secondary)] transition-colors underline underline-offset-2'
        >
          Not redirecting? Click here
        </a>
      </div>
    </div>
  );
}
