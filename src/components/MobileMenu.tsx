'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileMenuProps {
  links: { href: string; label: string }[];
}

export default function MobileMenu({ links }: MobileMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  function closeMenu() {
    if (detailsRef.current) {
      detailsRef.current.removeAttribute('open');
    }
  }

  return (
    <div className='md:hidden'>
      <details ref={detailsRef} className='group relative'>
        <summary className='list-none cursor-pointer p-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-tertiary)] transition-colors'>
          <svg
            className='w-6 h-6 text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.8}
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
            />
          </svg>
        </summary>

        <div className='absolute right-0 top-full mt-2 w-56 glass-heavy rounded-[var(--radius-lg)] p-2 animate-slide-up shadow-lg shadow-black/40'>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'text-[var(--fg-primary)] bg-[var(--bg-tertiary)]'
                  : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
