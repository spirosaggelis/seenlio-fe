'use client';

import { useState } from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  align?: 'left' | 'right';
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  defaultSort?: keyof T;
  defaultDir?: 'asc' | 'desc';
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  defaultSort,
  defaultDir = 'desc',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | undefined>(defaultSort);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultDir);

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      })
    : data;

  return (
    <div className='overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-subtle)]'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]'>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={[
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] cursor-pointer select-none hover:text-[var(--fg-primary)] transition-colors',
                  col.align === 'right' ? 'text-right' : 'text-left',
                ].join(' ')}
                onClick={() => toggleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className='ml-1 text-[var(--accent-purple)]'>
                    {sortDir === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y divide-[var(--border-subtle)]'>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className='bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors'
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={[
                    'px-4 py-3 text-[var(--fg-secondary)]',
                    col.align === 'right' ? 'text-right' : 'text-left',
                  ].join(' ')}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className='px-4 py-8 text-center text-[var(--fg-muted)] text-sm'
              >
                No data for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
