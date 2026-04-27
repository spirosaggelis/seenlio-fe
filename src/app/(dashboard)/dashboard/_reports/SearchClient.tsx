'use client';

import DataTable from '../_components/DataTable';

interface QueryRow {
  query: string;
  count: number;
  avgResults: number;
}

const queryColumns = [
  { key: 'query' as const, label: 'Query' },
  {
    key: 'count' as const,
    label: 'Searches',
    align: 'right' as const,
    render: (v: unknown) => (v as number).toLocaleString(),
  },
  {
    key: 'avgResults' as const,
    label: 'Avg Results',
    align: 'right' as const,
    render: (v: unknown) => (v as number).toLocaleString(),
  },
];

export function TopQueriesTable({ data }: { data: QueryRow[] }) {
  return (
    <DataTable
      columns={queryColumns}
      data={data as unknown as Record<string, unknown>[]}
      defaultSort='count'
    />
  );
}

export function ZeroResultsTable({ data }: { data: QueryRow[] }) {
  return (
    <DataTable
      columns={queryColumns}
      data={data as unknown as Record<string, unknown>[]}
      defaultSort='count'
    />
  );
}
