import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Lost in the Void | Seenlio',
  description:
    'This page has gone viral… in the wrong direction. Let us help you find what you were looking for.',
};

export default function NotFound() {
  return (
    <div className='min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden'>
      {/* Animated background orbs */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute top-1/4 left-1/4 w-125 h-125 bg-purple-500/8 rounded-full blur-[160px] animate-float' />
        <div className='absolute bottom-1/4 right-1/4 w-100 h-100 bg-cyan-500/8 rounded-full blur-[140px] animate-float-delayed' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-pink-500/5 rounded-full blur-[180px] animate-float-slow' />
      </div>

      {/* Animated grid lines */}
      <div
        className='absolute inset-0 pointer-events-none opacity-[0.03]'
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className='relative z-10 text-center px-6 max-w-2xl mx-auto'>
        {/* Glitch-style 404 number */}
        <div className='relative mb-8'>
          <h1
            className='text-[12rem] sm:text-[16rem] font-black leading-none tracking-tighter select-none'
            style={{
              background:
                'linear-gradient(135deg, #8b5cf6 0%, #ec4899 40%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 60px rgba(139, 92, 246, 0.3))',
            }}
          >
            404
          </h1>

          {/* Decorative scan line */}
          <div className='absolute inset-0 flex items-center justify-center overflow-hidden'>
            <div
              className='w-full h-px opacity-20'
              style={{
                background:
                  'linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)',
                animation: 'scanLine 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Trending badge */}
        <div
          className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6 animate-fade-in-up'
          style={{ animationDelay: '200ms' }}
        >
          <span className='text-lg'>📉</span>
          Trend Score: 0 — This page didn&apos;t make the cut
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
          Lost in the <span className='gradient-text-warm'>Void</span>
        </h2>

        <p
          className='text-gray-400 text-lg leading-relaxed mb-10 animate-fade-in-up'
          style={{
            animationDelay: '400ms',
            animationFillMode: 'forwards',
            opacity: 0,
          }}
        >
          This product must have been recalled from the internet.
          <br className='hidden sm:block' />
          Don&apos;t worry — there are plenty more trending finds waiting for
          you.
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
          <Link
            href='/'
            className='group relative flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]'
          >
            <div className='absolute inset-0 bg-linear-to-r from-purple-600 to-cyan-600' />
            <div className='absolute inset-0 bg-linear-to-r from-purple-600 to-cyan-600 blur-xl opacity-40 group-hover:opacity-60 transition-opacity' />
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
                d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
              />
            </svg>
            <span className='relative'>Back to Home</span>
          </Link>

          <Link
            href='/trending'
            className='group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-gray-300 border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:bg-white/10 hover:text-white hover:scale-[1.03] active:scale-[0.98]'
          >
            <span className='text-lg'>🔥</span>
            <span>See What&apos;s Trending</span>
          </Link>
        </div>

        {/* Fun product code reference */}
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
                d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14'
              />
            </svg>
            ERROR_CODE: VP-404 • STATUS: page_not_found
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
