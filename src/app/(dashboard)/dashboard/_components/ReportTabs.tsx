'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { REPORT_TABS, type ReportTabId } from './reportTabs';

export default function ReportTabs({ active }: { active: ReportTabId }) {
  const searchParams = useSearchParams();

  function hrefFor(id: ReportTabId): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    return `/dashboard?${params.toString()}`;
  }

  return (
    <div className='border-b border-[var(--border-subtle)]'>
      <nav className='flex gap-1 -mb-px overflow-x-auto'>
        {REPORT_TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={hrefFor(tab.id)}
              scroll={false}
              className={[
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-[var(--accent-purple)] text-[var(--fg-primary)]'
                  : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg-primary)]',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
