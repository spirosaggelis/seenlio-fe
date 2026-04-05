'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className='min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden'>
      {/* Animated background orbs — red/orange tinted for "danger" feel */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute top-1/4 left-1/3 w-125 h-125 bg-red-500/8 rounded-full blur-[160px] animate-float' />
        <div className='absolute bottom-1/3 right-1/4 w-100 h-100 bg-orange-500/8 rounded-full blur-[140px] animate-float-delayed' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-purple-500/5 rounded-full blur-[180px] animate-float-slow' />
      </div>

      {/* Grid lines */}
      <div
        className='absolute inset-0 pointer-events-none opacity-[0.03]'
        style={{
          backgroundImage: `
            linear-gradient(rgba(239,68,68,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,68,68,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className='relative z-10 text-center px-6 max-w-2xl mx-auto'>
        {/* Glitch-style 500 number */}
        <div className='relative mb-8'>
          <h1
            className='text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter select-none'
            style={{
              background:
                'linear-gradient(135deg, #ef4444 0%, #f97316 40%, #eab308 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 60px rgba(239, 68, 68, 0.3))',
            }}
          >
            500
          </h1>

          {/* Decorative scan line */}
          <div className='absolute inset-0 flex items-center justify-center overflow-hidden'>
            <div
              className='w-full h-px opacity-20'
              style={{
                background:
                  'linear-gradient(90deg, transparent, #ef4444, #f97316, transparent)',
                animation: 'scanLine 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Status badge */}
        <div
          className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6 animate-fade-in-up'
          style={{ animationDelay: '200ms' }}
        >
          <span className='text-lg'>💥</span>
          System Overload — Something blew a fuse
        </div>

        {/* Message */}
        <h2
          className='text-2xl sm:text-3xl font-bold text-white mb-4 animate-fade-in-up'
          style={{
            animationDelay: '300ms',
            animationFillMode: 'forwards',
            opacity: 0,
          }}
        >
          Well, that wasn&apos;t supposed to <span style={{
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>happen</span>
        </h2>

        <p
          className='text-gray-400 text-lg leading-relaxed mb-10 animate-fade-in-up'
          style={{
            animationDelay: '400ms',
            animationFillMode: 'forwards',
            opacity: 0,
          }}
        >
          Our servers tried to find something cool for you
          <br className='hidden sm:block' />
          and got a little too excited. Give it another shot!
        </p>

        {/* Action buttons */}
        <div
          className='flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up'
          style={{
            animationDelay: '500ms',
            animationFillMode: 'forwards',
            opacity: 0,
          }}
        >
          <button
            onClick={reset}
            className='group relative flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer'
          >
            <div className='absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600' />
            <div className='absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 blur-xl opacity-40 group-hover:opacity-60 transition-opacity' />
            <svg
              className='relative w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182'
              />
            </svg>
            <span className='relative'>Try Again</span>
          </button>

          <Link
            href='/'
            className='group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-gray-300 border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:bg-white/10 hover:text-white hover:scale-[1.03] active:scale-[0.98]'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
              />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Error digest */}
        <div
          className='mt-16 animate-fade-in-up'
          style={{
            animationDelay: '700ms',
            animationFillMode: 'forwards',
            opacity: 0,
          }}
        >
          <div className='inline-flex items-center gap-2 text-xs font-mono text-gray-600 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-lg'>
            <svg
              className='w-3.5 h-3.5 text-gray-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
              />
            </svg>
            ERROR_CODE: VP-500{error.digest ? ` • DIGEST: ${error.digest}` : ''} • STATUS: internal_error
          </div>
        </div>
      </div>

      {/* Scan line animation */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-80px); opacity: 0; }
          10% { opacity: 0.3; }
          50% { transform: translateY(80px); opacity: 0.15; }
          90% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
