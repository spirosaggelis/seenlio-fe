'use client';

import { useEffect, useState } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type='button'
      aria-label='Scroll to top'
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full glass-heavy flex items-center justify-center text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--accent-purple)] shadow-lg shadow-black/40 transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <svg
        className='w-5 h-5'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={2}
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M4.5 15.75l7.5-7.5 7.5 7.5'
        />
      </svg>
    </button>
  );
}
