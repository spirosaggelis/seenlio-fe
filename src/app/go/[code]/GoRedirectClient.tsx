'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { trackAffiliateClick } from '@/lib/analytics';

const PLATFORM_LABELS: Record<string, string> = {
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  temu: 'Temu',
  tiktok_shop: 'TikTok Shop',
  other: 'the store',
};

const STEPS = ['Finding best deal', 'Checking your region', 'Preparing link'];

interface GoRedirectClientProps {
  destinationUrl: string;
  productCode: string;
  platform: string;
  productName?: string;
}

export default function GoRedirectClient({
  destinationUrl,
  productCode,
  platform,
  productName,
}: GoRedirectClientProps) {
  // step: 0 = first step active, 1 = second active, 2 = third active, 3 = all done
  const [step, setStep] = useState(0);
  const platformLabel = PLATFORM_LABELS[platform] || PLATFORM_LABELS.other;

  useEffect(() => {
    // Fire GTM immediately — runs client-side so window.dataLayer is available
    trackAffiliateClick(productCode, platform, destinationUrl, 'short_url');

    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => setStep(3), 2000);
    const redirect = setTimeout(() => {
      window.location.href = destinationUrl;
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(redirect);
    };
  }, [destinationUrl, productCode, platform]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-float-delayed pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating decorative shapes */}
      <div className="absolute top-[15%] right-[12%] w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rotate-12 animate-float-slow hidden lg:block" />
      <div className="absolute bottom-[20%] left-[10%] w-12 h-12 rounded-xl bg-purple-500/[0.08] border border-purple-500/[0.15] backdrop-blur-sm -rotate-6 animate-float-delayed hidden lg:block" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Seenlio"
          width={140}
          height={42}
          className="h-10 w-auto opacity-75"
          priority
        />

        {/* Card */}
        <div className="glass-card w-full px-8 py-10 text-center">
          {/* Animated icon */}
          <div className="relative mx-auto mb-7 w-[72px] h-[72px]">
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-60 transition-opacity duration-500"
              style={{
                background:
                  step < 3
                    ? 'linear-gradient(135deg, #8b5cf6, #ec4899, #06b6d4)'
                    : 'linear-gradient(135deg, #10b981, #06b6d4)',
              }}
            />
            {/* Icon circle */}
            <div
              className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                background:
                  step < 3
                    ? 'linear-gradient(135deg, #7c3aed, #db2777, #0891b2)'
                    : 'linear-gradient(135deg, #059669, #0891b2)',
              }}
            >
              {step < 3 ? (
                <svg
                  className="w-8 h-8 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-white animate-fade-in"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-[1.4rem] font-bold text-white leading-snug mb-1 transition-all duration-300">
            {step < 3 ? (
              'Finding your deal\u2026'
            ) : (
              <>
                Taking you to{' '}
                <span className="gradient-text">{platformLabel}</span>
              </>
            )}
          </h1>

          {productName && (
            <p className="text-xs text-[var(--fg-muted)] mt-1 mb-0 truncate px-2">
              {productName}
            </p>
          )}

          {/* Steps */}
          <div className="mt-8 space-y-3.5 text-left">
            {STEPS.map((label, i) => {
              const isDone = i < step;
              const isActive = i === step && step < 3;
              const isPending = i > step;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-300 ${isPending ? 'opacity-25' : 'opacity-100'}`}
                >
                  {/* Step indicator */}
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
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping block" />
                    )}
                  </div>

                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isDone || isActive
                        ? 'text-[var(--fg-primary)]'
                        : 'text-[var(--fg-faint)]'
                    }`}
                  >
                    {label}
                    {isDone && (
                      <span className="ml-3 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider opacity-80">
                        ✓ done
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skip link */}
        <a
          href={destinationUrl}
          className="text-xs text-[var(--fg-faint)] hover:text-[var(--fg-secondary)] transition-colors underline underline-offset-2"
        >
          Not redirecting? Click here
        </a>
      </div>
    </div>
  );
}
