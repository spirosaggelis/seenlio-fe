'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeaderSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (/^VP[A-Z0-9]{3,}$/i.test(trimmed)) {
      router.push(`/lookup?code=${encodeURIComponent(trimmed.toUpperCase())}`);
      return;
    }
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className={compact ? 'w-full' : 'hidden lg:block'}>
      <label className="sr-only" htmlFor={compact ? 'mobile-product-search' : 'header-product-search'}>
        Search products
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-faint)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          id={compact ? 'mobile-product-search' : 'header-product-search'}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products"
          className={`w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 outline-none transition-colors focus:border-purple-500/40 ${
            compact ? 'py-2.5' : 'py-2 w-56 xl:w-64'
          }`}
        />
      </div>
    </form>
  );
}
