'use client';

import { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ExpandedState,
} from '@tanstack/react-table';
import type { PivotRow } from '@/app/api/dashboard/social/route';

const col = createColumnHelper<PivotRow>();

function fmt(n: number) {
  return n.toLocaleString();
}

const COLUMNS = [
  col.accessor('product', { header: 'Product', aggregatedCell: ({ getValue }) => getValue() }),
  col.accessor('platform', { header: 'Platform', aggregatedCell: ({ getValue }) => getValue() }),
  col.accessor('channel', { header: 'Channel', aggregatedCell: ({ getValue }) => getValue() }),
  col.accessor('sourcePlatform', { header: 'Source' }),
  col.accessor('published', { header: 'Published' }),
  col.accessor('views', {
    header: 'Views',
    cell: ({ getValue }) => fmt(getValue()),
    aggregationFn: 'sum',
    aggregatedCell: ({ getValue }) => <strong>{fmt(getValue() as number)}</strong>,
  }),
  col.accessor('likes', {
    header: 'Likes',
    cell: ({ getValue }) => fmt(getValue()),
    aggregationFn: 'sum',
    aggregatedCell: ({ getValue }) => <strong>{fmt(getValue() as number)}</strong>,
  }),
  col.accessor('shares', {
    header: 'Shares',
    cell: ({ getValue }) => fmt(getValue()),
    aggregationFn: 'sum',
    aggregatedCell: ({ getValue }) => <strong>{fmt(getValue() as number)}</strong>,
  }),
  col.accessor('comments', {
    header: 'Comments',
    cell: ({ getValue }) => fmt(getValue()),
    aggregationFn: 'sum',
    aggregatedCell: ({ getValue }) => <strong>{fmt(getValue() as number)}</strong>,
  }),
];

interface Props {
  rows: PivotRow[];
}

export default function SocialPivot({ rows }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'views', desc: true }]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data: rows,
    columns: COLUMNS,
    state: { sorting, grouping: ['product', 'platform', 'channel'], expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    groupedColumnMode: false,
    autoResetExpanded: false,
    autoResetPageIndex: false,
  });

  if (!rows.length) {
    return (
      <p className='text-sm text-(--fg-muted) py-6 text-center'>
        No data — run the analytics collector first.
      </p>
    );
  }

  return (
    <div className='overflow-auto rounded-md border border-(--border-subtle)' style={{ maxHeight: 520 }}>
      <table className='w-full text-sm border-collapse'>
        <thead className='sticky top-0 z-10' style={{ background: 'var(--bg-tertiary)' }}>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  className='px-3 py-2 text-left text-xs font-semibold text-(--fg-secondary) uppercase tracking-wider whitespace-nowrap border-b border-(--border-subtle) select-none'
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' && ' ↑'}
                  {header.column.getIsSorted() === 'desc' && ' ↓'}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => {
            const isGroup = row.getIsGrouped();
            const depth = row.depth;
            return (
              <tr
                key={row.id}
                className={
                  isGroup
                    ? 'bg-(--bg-tertiary) hover:bg-(--bg-secondary)'
                    : 'hover:bg-(--bg-tertiary)'
                }
              >
                {row.getVisibleCells().map(cell => {
                  const isGrouped = cell.getIsGrouped();
                  const isAggregated = cell.getIsAggregated();
                  const isPlaceholder = cell.getIsPlaceholder();

                  if (isPlaceholder) return <td key={cell.id} className='px-3 py-2 border-b border-(--border-subtle)' />;

                  return (
                    <td
                      key={cell.id}
                      className='px-3 py-2 border-b border-(--border-subtle) text-foreground'
                      style={isGrouped ? { paddingLeft: `${depth * 16 + 12}px`, overflow: 'hidden' } : { overflow: 'hidden' }}
                    >
                      {isGrouped ? (
                        <button
                          onClick={row.getToggleExpandedHandler()}
                          className='flex items-center gap-1.5 font-medium text-(--accent-purple-light) w-full min-w-0'
                        >
                          <span className='text-xs shrink-0'>{row.getIsExpanded() ? '▼' : '▶'}</span>
                          <span style={depth === 0 ? { wordBreak: 'break-word', overflowWrap: 'break-word', textAlign: 'left' } : { textAlign: 'left' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                          <span className='text-xs text-(--fg-muted) shrink-0'>({row.subRows.length})</span>
                        </button>
                      ) : isAggregated ? (
                        flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
