'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export function getDateRange(searchParams: URLSearchParams): { from: string; to: string } {
  const to = searchParams.get('to') ?? isoDate(new Date());
  const now = new Date();
  const from = searchParams.get('from') ?? isoDate(new Date(now.getTime() - 30 * 86400_000));
  return { from, to };
}

export default function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFrom = searchParams.get('from');
  const currentTo = searchParams.get('to');

  function applyPreset(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    const now = new Date();
    const from = days === 0 ? now : new Date(now.getTime() - days * 86400_000);
    params.set('from', isoDate(from));
    params.set('to', isoDate(now));
    router.push(`${pathname}?${params.toString()}`);
  }

  function isActive(days: number) {
    if (!currentFrom || !currentTo) return days === 30;
    const now = new Date();
    const expectedFrom = isoDate(days === 0 ? now : new Date(now.getTime() - days * 86400_000));
    return currentFrom === expectedFrom;
  }

  return (
    <div className='flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-[var(--radius-sm)] p-1'>
      {PRESETS.map((p) => (
        <button
          key={p.days}
          onClick={() => applyPreset(p.days)}
          className={[
            'px-3 py-1.5 rounded text-xs font-medium transition-all',
            isActive(p.days)
              ? 'bg-[var(--accent-purple)] text-white'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]',
          ].join(' ')}
        >
          {p.label}
        </button>
      ))}
      <div className='w-px h-4 bg-[var(--border-subtle)] mx-1' />
      <input
        type='date'
        value={currentFrom ?? ''}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('from', e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className='bg-transparent text-xs text-[var(--fg-secondary)] border-0 outline-none cursor-pointer'
      />
      <span className='text-[var(--fg-muted)] text-xs'>→</span>
      <input
        type='date'
        value={currentTo ?? ''}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('to', e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className='bg-transparent text-xs text-[var(--fg-secondary)] border-0 outline-none cursor-pointer'
      />
    </div>
  );
}
