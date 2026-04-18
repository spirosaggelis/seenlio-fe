'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import CategoryIcon from '@/components/CategoryIcon';

export interface FilterCategory {
  id: number;
  name: string;
  slug: string;
}

type SortKey = 'trend' | 'new' | 'price-asc' | 'price-desc' | 'rating';

export interface ProductFilterBarProps {
  categories: FilterCategory[];
  totalResults: number;
  currentCategory: string;
  currentPrice: string;
  currentSort: SortKey;
}

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'trend', label: 'Trending' },
  { value: 'new', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

const PRICE_BUCKETS: Array<{ value: string; label: string }> = [
  { value: '0-25', label: 'Under $25' },
  { value: '25-50', label: '$25 – $50' },
  { value: '50-100', label: '$50 – $100' },
  { value: '100-', label: '$100+' },
];

export default function ProductFilterBar({
  categories,
  totalResults,
  currentCategory,
  currentPrice,
  currentSort,
}: ProductFilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = (currentCategory ? 1 : 0) + (currentPrice ? 1 : 0);

  const applyParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams();
      if (currentCategory) params.set('category', currentCategory);
      if (currentPrice) params.set('price', currentPrice);
      if (currentSort !== 'trend') params.set('sort', currentSort);
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page');
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/products?${qs}` : '/products', { scroll: false });
      });
    },
    [router, currentCategory, currentPrice, currentSort],
  );

  const clearAll = () => {
    startTransition(() => {
      router.push('/products', { scroll: false });
    });
    setDrawerOpen(false);
  };

  const toggleCategory = (slug: string) => {
    applyParam('category', currentCategory === slug ? null : slug);
  };

  const togglePrice = (bucket: string) => {
    applyParam('price', currentPrice === bucket ? null : bucket);
  };

  const onSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as SortKey;
    applyParam('sort', v === 'trend' ? null : v);
  };

  const sortLabel = useMemo(
    () =>
      SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? 'Trending',
    [currentSort],
  );

  return (
    <>
      {/* ── Desktop / tablet bar ───────────────────────────── */}
      <div className='hidden sm:block mb-8'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-4'>
          {/* Category chips */}
          <div className='flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin'>
            <button
              type='button'
              onClick={() => applyParam('category', null)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border ${
                !currentCategory
                  ? 'bg-purple-500/20 border-purple-400/60 text-white'
                  : 'border-white/10 text-gray-300 hover:border-purple-400/40 hover:text-purple-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const active = currentCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type='button'
                  onClick={() => toggleCategory(cat.slug)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border ${
                    active
                      ? 'bg-purple-500/20 border-purple-400/60 text-white'
                      : 'border-white/10 text-gray-300 hover:border-purple-400/40 hover:text-purple-200'
                  }`}
                >
                  <span className='w-4 h-4 inline-block'>
                    <CategoryIcon slug={cat.slug} className='w-4 h-4' />
                  </span>
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Price + Sort row */}
          <div className='mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5'>
            <span className='text-xs uppercase tracking-wider text-gray-500'>
              Price
            </span>
            <div className='flex flex-wrap gap-2'>
              {PRICE_BUCKETS.map((b) => {
                const active = currentPrice === b.value;
                return (
                  <button
                    key={b.value}
                    type='button'
                    onClick={() => togglePrice(b.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                      active
                        ? 'bg-cyan-500/20 border-cyan-400/60 text-white'
                        : 'border-white/10 text-gray-300 hover:border-cyan-400/40 hover:text-cyan-200'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
            <div className='ml-auto flex items-center gap-2'>
              {activeCount > 0 && (
                <button
                  type='button'
                  onClick={clearAll}
                  className='text-xs text-gray-400 hover:text-white underline-offset-4 hover:underline'
                >
                  Clear ({activeCount})
                </button>
              )}
              <label className='text-xs uppercase tracking-wider text-gray-500'>
                Sort
              </label>
              <select
                value={currentSort}
                onChange={onSortChange}
                className='bg-[#14141d] border border-white/10 text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-400/60'
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {isPending && (
          <div className='mt-2 text-xs text-purple-300/60 animate-pulse'>
            Updating…
          </div>
        )}
      </div>

      {/* ── Mobile: trigger + drawer ──────────────────────── */}
      <div className='sm:hidden mb-6'>
        <div className='flex items-center justify-between gap-2'>
          <button
            type='button'
            onClick={() => setDrawerOpen(true)}
            className='h-9 shrink-0 inline-flex items-center gap-1.5 px-3 rounded-lg border border-white/15 bg-white/5 text-gray-200 text-xs leading-none'
          >
            <svg
              className='w-3.5 h-3.5'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M3 4h18M6 12h12M10 20h4'
              />
            </svg>
            Filters
            {activeCount > 0 && (
              <span className='ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-purple-500/40 border border-purple-300/50 text-[10px] font-semibold text-white'>
                {activeCount}
              </span>
            )}
          </button>
          <select
            value={currentSort}
            onChange={onSortChange}
            className='h-9 w-auto bg-white/5 border border-white/15 text-gray-200 text-xs rounded-lg pl-3 pr-7 leading-none focus:outline-none focus:border-purple-400/60'
            aria-label='Sort'
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filter summary as horizontally scrolling chips */}
        {(currentCategory || currentPrice) && (
          <div className='mt-3 flex gap-2 overflow-x-auto'>
            {currentCategory && (
              <button
                type='button'
                onClick={() => applyParam('category', null)}
                className='shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-100 text-xs'
              >
                {categories.find((c) => c.slug === currentCategory)?.name ??
                  currentCategory}
                <span className='text-purple-300'>×</span>
              </button>
            )}
            {currentPrice && (
              <button
                type='button'
                onClick={() => applyParam('price', null)}
                className='shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 text-xs'
              >
                {PRICE_BUCKETS.find((p) => p.value === currentPrice)?.label ??
                  currentPrice}
                <span className='text-cyan-300'>×</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile drawer ────────────────────────────────── */}
      {drawerOpen && (
        <div
          className='sm:hidden fixed inset-0 z-50 bg-black/85'
          onClick={() => setDrawerOpen(false)}
          role='presentation'
          style={{ isolation: 'isolate' }}
        >
          <div
            className='absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-white/15 p-5 max-h-[88vh] overflow-y-auto shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.9)]'
            onClick={(e) => e.stopPropagation()}
            role='dialog'
            aria-modal='true'
            aria-label='Filters'
            style={{ backgroundColor: '#050509', opacity: 1 }}
          >
            <div className='mx-auto w-12 h-1 rounded-full bg-white/20 mb-4' />
            <div className='flex items-center justify-between mb-5'>
              <h3 className='text-lg font-semibold text-white'>
                Filters
                {totalResults > 0 && (
                  <span className='ml-2 text-xs font-normal text-gray-500'>
                    ({totalResults} results)
                  </span>
                )}
              </h3>
              <div className='flex items-center gap-3'>
                {activeCount > 0 && (
                  <button
                    type='button'
                    onClick={clearAll}
                    className='text-xs text-gray-400 underline'
                  >
                    Clear all
                  </button>
                )}
                <button
                  type='button'
                  onClick={() => setDrawerOpen(false)}
                  aria-label='Close filters'
                  className='w-9 h-9 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-gray-300 hover:text-white hover:border-white/30 active:scale-95 transition'
                >
                  <svg
                    className='w-4 h-4'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M6 6l12 12M6 18L18 6'
                    />
                  </svg>
                </button>
              </div>
            </div>

            <section className='mb-6'>
              <h4 className='text-xs uppercase tracking-wider text-gray-500 mb-3'>
                Category
              </h4>
              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={() => applyParam('category', null)}
                  className={`px-3 py-2 rounded-full text-sm border transition ${
                    !currentCategory
                      ? 'bg-purple-500/25 border-purple-400/70 text-white'
                      : 'border-white/15 text-gray-300 hover:border-purple-400/40'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => {
                  const active = currentCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type='button'
                      onClick={() => toggleCategory(cat.slug)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm border transition ${
                        active
                          ? 'bg-purple-500/20 border-purple-400/60 text-white'
                          : 'border-white/10 text-gray-300'
                      }`}
                    >
                      <span className='w-4 h-4 inline-block'>
                        <CategoryIcon slug={cat.slug} className='w-4 h-4' />
                      </span>
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className='mb-6'>
              <h4 className='text-xs uppercase tracking-wider text-gray-500 mb-3'>
                Price
              </h4>
              <div className='grid grid-cols-2 gap-2'>
                {PRICE_BUCKETS.map((b) => {
                  const active = currentPrice === b.value;
                  return (
                    <button
                      key={b.value}
                      type='button'
                      onClick={() => togglePrice(b.value)}
                      className={`px-3 py-3 rounded-lg text-sm border transition ${
                        active
                          ? 'bg-cyan-500/25 border-cyan-400/70 text-white'
                          : 'border-white/15 text-gray-300 hover:border-cyan-400/40'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className='mb-2'>
              <h4 className='text-xs uppercase tracking-wider text-gray-500 mb-3'>
                Sort by
              </h4>
              <div className='flex flex-col gap-2'>
                {SORT_OPTIONS.map((o) => {
                  const active = currentSort === o.value;
                  return (
                    <button
                      key={o.value}
                      type='button'
                      onClick={() =>
                        applyParam('sort', o.value === 'trend' ? null : o.value)
                      }
                      className={`text-left px-3 py-3 rounded-lg text-sm border transition ${
                        active
                          ? 'bg-white/15 border-white/40 text-white'
                          : 'border-white/15 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      {o.label}
                      {active ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>
            </section>

            <button
              type='button'
              onClick={() => setDrawerOpen(false)}
              className='mt-4 w-full py-3 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold'
            >
              Show {totalResults > 0 ? `${totalResults} ` : ''}results
            </button>
          </div>
        </div>
      )}

      {/* Current sort label as a subtle badge (desktop only) */}
      <div className='hidden sm:block -mt-4 mb-6 text-xs text-gray-500'>
        Sorted: <span className='text-gray-300'>{sortLabel}</span>
        {activeCount > 0 && (
          <span className='ml-2'>
            · {activeCount} filter{activeCount > 1 ? 's' : ''} active
          </span>
        )}
      </div>
    </>
  );
}
