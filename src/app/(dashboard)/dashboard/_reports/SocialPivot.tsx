'use client';

import { useMemo, useState, type DragEvent } from 'react';
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
  type GroupingState,
  type ColumnOrderState,
  type CellContext,
} from '@tanstack/react-table';
import type { PivotRow } from '@/app/api/dashboard/social/route';

const col = createColumnHelper<PivotRow>();

function fmt(n: number) {
  return n.toLocaleString();
}

function textCell(ctx: CellContext<PivotRow, unknown>) {
  const { row, column, getValue } = ctx;
  if (row.getIsGrouped()) return String(getValue() ?? '');
  const parents = row.getParentRows?.() ?? [];
  if (parents.some(p => p.groupingColumnId === column.id)) return null;
  return String(getValue() ?? '');
}

const COLUMNS = [
  col.accessor('product', { id: 'product', header: 'Product', cell: textCell, aggregatedCell: () => null }),
  col.accessor('platform', { id: 'platform', header: 'Platform', cell: textCell, aggregatedCell: () => null }),
  col.accessor('channel', { id: 'channel', header: 'Channel', cell: textCell, aggregatedCell: () => null }),
  col.accessor('sourcePlatform', { id: 'sourcePlatform', header: 'Source', cell: textCell, aggregatedCell: () => null }),
  col.accessor('published', { id: 'published', header: 'Published', cell: textCell, aggregatedCell: () => null }),
  col.accessor('views', {
    id: 'views',
    header: 'Views',
    cell: ({ getValue }) => fmt(getValue()),
    aggregationFn: 'sum',
    aggregatedCell: ({ getValue }) => <strong>{fmt(getValue() as number)}</strong>,
  }),
  col.accessor('likes', {
    id: 'likes',
    header: 'Likes',
    cell: ({ getValue }) => fmt(getValue()),
    aggregationFn: 'sum',
    aggregatedCell: ({ getValue }) => <strong>{fmt(getValue() as number)}</strong>,
  }),
  col.accessor('shares', {
    id: 'shares',
    header: 'Shares',
    cell: ({ getValue }) => fmt(getValue()),
    aggregationFn: 'sum',
    aggregatedCell: ({ getValue }) => <strong>{fmt(getValue() as number)}</strong>,
  }),
  col.accessor('comments', {
    id: 'comments',
    header: 'Comments',
    cell: ({ getValue }) => fmt(getValue()),
    aggregationFn: 'sum',
    aggregatedCell: ({ getValue }) => <strong>{fmt(getValue() as number)}</strong>,
  }),
];

const COLUMN_LABELS: Record<string, string> = {
  product: 'Product',
  platform: 'Platform',
  channel: 'Channel',
  sourcePlatform: 'Source',
  published: 'Published',
  views: 'Views',
  likes: 'Likes',
  shares: 'Shares',
  comments: 'Comments',
};

const GROUPABLE_IDS = new Set(['product', 'platform', 'channel', 'sourcePlatform']);

interface Props {
  rows: PivotRow[];
}

type DragPayload =
  | { kind: 'header'; id: string }
  | { kind: 'group'; id: string };

const DT_MIME = 'application/x-pivot-drag';

export default function SocialPivot({ rows }: Props) {
  const allColumnIds = useMemo(() => COLUMNS.map(c => c.id as string), []);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'views', desc: true }]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [grouping, setGrouping] = useState<GroupingState>(['product']);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(allColumnIds);
  const [dragOver, setDragOver] = useState<{ zone: 'group' | 'header'; id?: string } | null>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: COLUMNS,
    state: { sorting, grouping, expanded, columnOrder },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    groupedColumnMode: 'remove',
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

  const allExpanded = table.getIsAllRowsExpanded();

  // Helpers
  const removeFromGrouping = (id: string) => setGrouping(prev => prev.filter(g => g !== id));
  const addToGrouping = (id: string) => {
    if (!GROUPABLE_IDS.has(id)) return;
    setGrouping(prev => (prev.includes(id) ? prev : [...prev, id]));
  };
  const reorderGrouping = (draggedId: string, targetId: string) => {
    setGrouping(prev => {
      const next = prev.filter(g => g !== draggedId);
      const idx = next.indexOf(targetId);
      next.splice(idx < 0 ? next.length : idx, 0, draggedId);
      return next;
    });
  };
  const reorderColumn = (draggedId: string, targetId: string) => {
    setColumnOrder(prev => {
      const base = prev.length ? [...prev] : [...allColumnIds];
      const next = base.filter(id => id !== draggedId);
      const idx = next.indexOf(targetId);
      next.splice(idx < 0 ? next.length : idx, 0, draggedId);
      return next;
    });
  };

  // Drag handlers
  const startDrag = (e: DragEvent, payload: DragPayload) => {
    e.dataTransfer.setData(DT_MIME, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };
  const readDrag = (e: DragEvent): DragPayload | null => {
    try {
      const raw = e.dataTransfer.getData(DT_MIME);
      if (!raw) return null;
      return JSON.parse(raw) as DragPayload;
    } catch {
      return null;
    }
  };

  const onGroupZoneDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver({ zone: 'group' });
  };
  const onGroupZoneDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const p = readDrag(e);
    if (!p) return;
    if (p.kind === 'header') addToGrouping(p.id);
  };

  const onChipDragOver = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver({ zone: 'group', id: targetId });
  };
  const onChipDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOver(null);
    const p = readDrag(e);
    if (!p) return;
    if (p.kind === 'group') reorderGrouping(p.id, targetId);
    else if (p.kind === 'header') {
      // Add then move to position
      setGrouping(prev => {
        const without = prev.filter(g => g !== p.id);
        const idx = without.indexOf(targetId);
        without.splice(idx < 0 ? without.length : idx, 0, p.id);
        return without;
      });
    }
  };

  const onHeaderDragOver = (e: DragEvent, targetId: string) => {
    const p = e.dataTransfer.types.includes(DT_MIME);
    if (!p) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver({ zone: 'header', id: targetId });
  };
  const onHeaderDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOver(null);
    const p = readDrag(e);
    if (!p) return;
    if (p.kind === 'header') reorderColumn(p.id, targetId);
    else if (p.kind === 'group') removeFromGrouping(p.id); // drag chip back to headers = ungroup
  };

  const onDragEnd = () => setDragOver(null);

  const groupZoneActive = dragOver?.zone === 'group' && !dragOver.id;

  return (
    <div className='space-y-3'>
      {/* Row-group drop zone */}
      <div
        onDragOver={onGroupZoneDragOver}
        onDragLeave={() => setDragOver(null)}
        onDrop={onGroupZoneDrop}
        className={[
          'flex items-center gap-2 flex-wrap min-h-11 px-3 py-2 rounded-md border border-dashed transition-colors',
          groupZoneActive
            ? 'border-(--accent-purple) bg-(--accent-purple)/10'
            : 'border-(--border-subtle) bg-(--bg-tertiary)/40',
        ].join(' ')}
      >
        <span className='text-xs text-(--fg-muted) uppercase tracking-wider'>Row groups</span>
        {grouping.length === 0 && (
          <span className='text-xs text-(--fg-muted) italic'>Drag column headers here to group</span>
        )}
        {grouping.map((id, i) => {
          const isTarget = dragOver?.zone === 'group' && dragOver.id === id;
          return (
            <span
              key={id}
              draggable
              onDragStart={e => startDrag(e, { kind: 'group', id })}
              onDragOver={e => onChipDragOver(e, id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => onChipDrop(e, id)}
              onDragEnd={onDragEnd}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-(--accent-purple) text-white cursor-grab active:cursor-grabbing select-none',
                isTarget ? 'ring-2 ring-white/50' : '',
              ].join(' ')}
            >
              <span className='opacity-60 text-[10px]'>{i + 1}</span>
              <span>{COLUMN_LABELS[id] ?? id}</span>
              <button
                type='button'
                onClick={() => removeFromGrouping(id)}
                onMouseDown={e => e.stopPropagation()}
                className='opacity-80 hover:opacity-100 text-xs leading-none'
                aria-label={`Remove ${COLUMN_LABELS[id] ?? id} from grouping`}
              >
                ×
              </button>
            </span>
          );
        })}
        <div className='ml-auto'>
          <button
            type='button'
            onClick={() => table.toggleAllRowsExpanded(!allExpanded)}
            className='px-3 py-1 rounded text-xs font-medium bg-(--bg-tertiary) text-(--fg-secondary) hover:text-foreground hover:bg-(--bg-secondary) transition-all border border-(--border-subtle)'
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-auto rounded-md border border-(--border-subtle)' style={{ maxHeight: 520 }}>
        <table className='w-full text-sm border-collapse'>
          <thead className='sticky top-0 z-10' style={{ background: 'var(--bg-tertiary)' }}>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const canGroup = GROUPABLE_IDS.has(header.column.id);
                  const isTarget = dragOver?.zone === 'header' && dragOver.id === header.column.id;
                  return (
                    <th
                      key={header.id}
                      draggable
                      onDragStart={e => startDrag(e, { kind: 'header', id: header.column.id })}
                      onDragOver={e => onHeaderDragOver(e, header.column.id)}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => onHeaderDrop(e, header.column.id)}
                      onDragEnd={onDragEnd}
                      className={[
                        'px-3 py-2 text-left text-xs font-semibold text-(--fg-secondary) uppercase tracking-wider whitespace-nowrap border-b border-(--border-subtle) select-none cursor-grab active:cursor-grabbing',
                        isTarget ? 'bg-(--accent-purple)/20' : '',
                      ].join(' ')}
                      title={canGroup ? 'Drag to reorder · drop on Row groups to group' : 'Drag to reorder'}
                    >
                      <span
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && ' ↑'}
                        {header.column.getIsSorted() === 'desc' && ' ↓'}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              const isGroup = row.getIsGrouped();
              const depth = row.depth;
              const cells = row.getVisibleCells();
              const groupingCellId = row.groupingColumnId;

              if (isGroup) {
                // Render group-header row: one "group label" cell spanning the leftmost text columns
                // then the aggregated metric cells.
                const metricCells = cells.filter(c => !GROUPABLE_IDS.has(c.column.id) && c.column.id !== 'published');
                const textColSpan = cells.length - metricCells.length;
                const labelCol = cells.find(c => c.column.id === groupingCellId);
                return (
                  <tr key={row.id} className='bg-(--bg-tertiary) hover:bg-(--bg-secondary)'>
                    <td
                      colSpan={Math.max(1, textColSpan)}
                      className='px-3 py-2 border-b border-(--border-subtle) text-foreground'
                      style={{ paddingLeft: `${depth * 16 + 12}px`, overflow: 'hidden' }}
                    >
                      <button
                        onClick={row.getToggleExpandedHandler()}
                        className='flex items-center gap-1.5 font-medium text-(--accent-purple-light) min-w-0 text-left'
                      >
                        <span className='text-xs shrink-0'>{row.getIsExpanded() ? '▼' : '▶'}</span>
                        <span className='text-(--fg-muted) text-[11px] uppercase tracking-wider'>
                          {COLUMN_LABELS[groupingCellId ?? ''] ?? groupingCellId}:
                        </span>
                        <span style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {labelCol
                            ? flexRender(labelCol.column.columnDef.cell, labelCol.getContext())
                            : String(row.getGroupingValue(groupingCellId ?? '') ?? '')}
                        </span>
                        <span className='text-xs text-(--fg-muted) shrink-0'>({row.subRows.length})</span>
                      </button>
                    </td>
                    {metricCells.map(cell => (
                      <td
                        key={cell.id}
                        className='px-3 py-2 border-b border-(--border-subtle) text-foreground'
                      >
                        {flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              }

              return (
                <tr key={row.id} className='hover:bg-(--bg-tertiary)'>
                  {cells.map(cell => {
                    const isPlaceholder = cell.getIsPlaceholder();
                    if (isPlaceholder) {
                      return <td key={cell.id} className='px-3 py-2 border-b border-(--border-subtle)' />;
                    }
                    return (
                      <td
                        key={cell.id}
                        className='px-3 py-2 border-b border-(--border-subtle) text-foreground'
                        style={{ overflow: 'hidden' }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
