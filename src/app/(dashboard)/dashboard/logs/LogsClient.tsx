'use client';

import { Fragment, useState } from 'react';

interface LogEntry {
  id: string;
  level: string;
  event: string;
  service: string;
  message?: string;
  category?: string;
  source?: string;
  runId?: string;
  targetId?: string;
  context?: Record<string, unknown>;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface Props {
  initialLogs: LogEntry[];
  initialPagination: Pagination;
}

const LEVELS = ['', 'debug', 'info', 'warning', 'error'] as const;

const LEVEL_STYLES: Record<string, string> = {
  debug: 'bg-gray-500/20 text-gray-300',
  info: 'bg-blue-500/20 text-blue-300',
  warning: 'bg-yellow-500/20 text-yellow-300',
  error: 'bg-red-500/20 text-red-300',
};

export default function LogsClient({ initialLogs, initialPagination }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Filters
  const [level, setLevel] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  async function fetchPage(page: number, lvl?: string, evt?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '25' });
      const l = lvl ?? level;
      const e = evt ?? eventFilter;
      if (l) params.set('level', l);
      if (e) params.set('event', e);

      const res = await fetch(`/api/dashboard/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || pagination);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(iso: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-wrap gap-3'>
        <select
          value={level}
          onChange={(e) => { setLevel(e.target.value); fetchPage(1, e.target.value, undefined); }}
          className='bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-1.5'
        >
          <option value=''>All Levels</option>
          {LEVELS.filter(Boolean).map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <input
          type='text'
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchPage(1, undefined, eventFilter); }}
          placeholder='Filter by event...'
          className='bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-1.5 w-56'
        />
        <button
          onClick={() => fetchPage(1, undefined, eventFilter)}
          className='text-xs px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors'
        >
          Search
        </button>

        <span className='ml-auto text-xs text-[var(--fg-muted)] self-center'>
          {pagination.total} total logs
        </span>
      </div>

      {/* Table */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden'>
        <div className={`overflow-x-auto${loading ? ' opacity-50 pointer-events-none' : ''}`}>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-xs text-[var(--fg-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)]'>
                <th className='text-left px-5 py-3'>Time</th>
                <th className='text-left px-5 py-3'>Level</th>
                <th className='text-left px-5 py-3'>Event</th>
                <th className='text-left px-5 py-3'>Message</th>
                <th className='text-left px-5 py-3'>Category</th>
                <th className='text-left px-5 py-3'>Source</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-5 py-12 text-center text-[var(--fg-muted)]'>
                    No logs found.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className='border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer'
                  >
                    <td className='px-5 py-3 text-[var(--fg-primary)] whitespace-nowrap'>
                      {formatTime(log.createdAt)}
                    </td>
                    <td className='px-5 py-3'>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${LEVEL_STYLES[log.level] || LEVEL_STYLES.info}`}>
                        {log.level || 'info'}
                      </span>
                    </td>
                    <td className='px-5 py-3 text-[var(--fg-secondary)] font-mono text-xs'>
                      {log.event}
                    </td>
                    <td className='px-5 py-3 text-[var(--fg-primary)] max-w-xs truncate'>
                      {log.message || '-'}
                    </td>
                    <td className='px-5 py-3 text-[var(--fg-muted)]'>
                      {log.category || '-'}
                    </td>
                    <td className='px-5 py-3'>
                      {log.source ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          log.source === 'amazon' ? 'bg-orange-500/20 text-orange-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {log.source}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expanded === log.id && (
                    <tr key={`${log.id}-detail`} className='border-b border-[var(--border-subtle)]'>
                      <td colSpan={6} className='px-5 py-4 bg-[var(--bg-tertiary)]'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                          {log.message && (
                            <div className='md:col-span-2'>
                              <p className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2'>Message</p>
                              <p className='text-[var(--fg-primary)]'>{log.message}</p>
                            </div>
                          )}
                          <div>
                            <p className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2'>Details</p>
                            <div className='flex flex-wrap gap-3'>
                              {log.service && (
                                <div className='bg-[var(--bg-secondary)] rounded px-3 py-1.5 border border-[var(--border-subtle)]'>
                                  <span className='text-[var(--fg-muted)] text-xs'>service: </span>
                                  <span className='text-[var(--fg-primary)] font-medium'>{log.service}</span>
                                </div>
                              )}
                              {log.runId && (
                                <div className='bg-[var(--bg-secondary)] rounded px-3 py-1.5 border border-[var(--border-subtle)]'>
                                  <span className='text-[var(--fg-muted)] text-xs'>run: </span>
                                  <span className='text-[var(--fg-primary)] font-mono font-medium'>{log.runId}</span>
                                </div>
                              )}
                              {log.targetId && (
                                <div className='bg-[var(--bg-secondary)] rounded px-3 py-1.5 border border-[var(--border-subtle)]'>
                                  <span className='text-[var(--fg-muted)] text-xs'>target: </span>
                                  <span className='text-[var(--fg-primary)] font-mono font-medium'>{log.targetId}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {log.context && Object.keys(log.context).length > 0 && (
                            <div>
                              <p className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2'>Context</p>
                              <pre className='text-xs text-[var(--fg-secondary)] bg-[var(--bg-secondary)] rounded px-3 py-2 border border-[var(--border-subtle)] overflow-x-auto'>
                                {JSON.stringify(log.context, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pageCount > 1 && (
          <div className='flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]'>
            <button
              onClick={() => fetchPage(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className='text-xs px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] disabled:opacity-30 transition-colors'
            >
              Previous
            </button>
            <span className='text-xs text-[var(--fg-muted)]'>
              Page {pagination.page} of {pagination.pageCount}
            </span>
            <button
              onClick={() => fetchPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.pageCount || loading}
              className='text-xs px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] disabled:opacity-30 transition-colors'
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
