'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HeaderSearch from '@/components/HeaderSearch';

interface MobileMenuProps {
  links: { href: string; label: string }[];
  categories?: { name: string; slug: string }[];
}

export default function MobileMenu({ links, categories = [] }: MobileMenuProps) {
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
        <summary className='list-none cursor-pointer p-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-tertiary)] transition-colors' aria-label='Toggle navigation menu'>
          <svg
            className='w-6 h-6 text-[var(--fg-secondary)] group-hover:text-[var(--fg-primary)] transition-colors'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.8}
            stroke='currentColor'
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
            />
          </svg>
        </summary>

        <div className='absolute right-0 top-full mt-2 w-72 glass-heavy rounded-[var(--radius-lg)] p-3 animate-slide-up shadow-lg shadow-black/40'>
          <div className='mb-2'>
            <HeaderSearch compact />
          </div>
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
          {categories.length > 0 && (
            <div className='mt-2 border-t border-white/10 pt-2'>
              <p className='px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]'>
                Categories
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  onClick={closeMenu}
                  className={`block px-4 py-2 rounded-[var(--radius-sm)] text-sm transition-all ${
                    pathname === `/categories/${cat.slug}`
                      ? 'text-[var(--fg-primary)] bg-[var(--bg-tertiary)]'
                      : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
