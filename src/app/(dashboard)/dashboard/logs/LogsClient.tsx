'use client';

import { Fragment, useState } from 'react';

interface LogEntry {
  id: string;
  jobId: string;
  jobType: string;
  jobStatus: string;
  severity: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  errorMessage?: string;
  result?: Record<string, number>;
  payload?: Record<string, unknown>;
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

const SEVERITIES = ['', 'debug', 'info', 'warning', 'error'] as const;
const JOB_TYPES = ['', 'pipeline', 'discovery', 'video_generation', 'publishing', 'analytics_collection', 'categorization'] as const;
const STATUSES = ['', 'completed', 'failed', 'running', 'pending', 'retrying'] as const;

const SEVERITY_STYLES: Record<string, string> = {
  debug: 'bg-gray-500/20 text-gray-300',
  info: 'bg-blue-500/20 text-blue-300',
  warning: 'bg-yellow-500/20 text-yellow-300',
  error: 'bg-red-500/20 text-red-300',
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-300',
  failed: 'bg-red-500/20 text-red-300',
  running: 'bg-blue-500/20 text-blue-300',
  pending: 'bg-gray-500/20 text-gray-300',
  retrying: 'bg-yellow-500/20 text-yellow-300',
};

export default function LogsClient({ initialLogs, initialPagination }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Filters
  const [severity, setSeverity] = useState('');
  const [jobType, setJobType] = useState('');
  const [jobStatus, setJobStatus] = useState('');

  async function fetchPage(page: number, sev?: string, type?: string, status?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '25' });
      const s = sev ?? severity;
      const t = type ?? jobType;
      const st = status ?? jobStatus;
      if (s) params.set('severity', s);
      if (t) params.set('jobType', t);
      if (st) params.set('jobStatus', st);

      const res = await fetch(`/api/dashboard/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || pagination);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter(key: 'severity' | 'jobType' | 'jobStatus', value: string) {
    if (key === 'severity') { setSeverity(value); fetchPage(1, value, undefined, undefined); }
    else if (key === 'jobType') { setJobType(value); fetchPage(1, undefined, value, undefined); }
    else { setJobStatus(value); fetchPage(1, undefined, undefined, value); }
  }

  function formatDuration(ms: number) {
    if (!ms) return '-';
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
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
          value={severity}
          onChange={(e) => applyFilter('severity', e.target.value)}
          className='bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-1.5'
        >
          <option value=''>All Severities</option>
          {SEVERITIES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={jobType}
          onChange={(e) => applyFilter('jobType', e.target.value)}
          className='bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-1.5'
        >
          <option value=''>All Job Types</option>
          {JOB_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={jobStatus}
          onChange={(e) => applyFilter('jobStatus', e.target.value)}
          className='bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-1.5'
        >
          <option value=''>All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

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
                <th className='text-left px-5 py-3'>Severity</th>
                <th className='text-left px-5 py-3'>Type</th>
                <th className='text-center px-5 py-3'>Status</th>
                <th className='text-center px-5 py-3'>Duration</th>
                <th className='text-left px-5 py-3'>Job ID</th>
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
                    <td className='px-5 py-3 text-[var(--fg-primary)]'>
                      {formatTime(log.startedAt)}
                    </td>
                    <td className='px-5 py-3'>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info}`}>
                        {log.severity || 'info'}
                      </span>
                    </td>
                    <td className='px-5 py-3 text-[var(--fg-secondary)]'>
                      {(log.jobType || '').replace('_', ' ')}
                    </td>
                    <td className='px-5 py-3 text-center'>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[log.jobStatus] || ''}`}>
                        {log.jobStatus}
                      </span>
                    </td>
                    <td className='px-5 py-3 text-center text-[var(--fg-muted)]'>
                      {formatDuration(log.duration)}
                    </td>
                    <td className='px-5 py-3 text-[var(--fg-muted)] font-mono text-xs'>
                      {log.jobId}
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expanded === log.id && (
                    <tr key={`${log.id}-detail`} className='border-b border-[var(--border-subtle)]'>
                      <td colSpan={6} className='px-5 py-4 bg-[var(--bg-tertiary)]'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                          {log.result && Object.keys(log.result).length > 0 && (
                            <div>
                              <p className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2'>Result</p>
                              <div className='flex flex-wrap gap-3'>
                                {Object.entries(log.result).map(([key, val]) => (
                                  <div key={key} className='bg-[var(--bg-secondary)] rounded px-3 py-1.5 border border-[var(--border-subtle)]'>
                                    <span className='text-[var(--fg-muted)] text-xs'>{key.replace('_', ' ')}: </span>
                                    <span className='text-[var(--fg-primary)] font-medium'>{val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {log.errorMessage && (
                            <div>
                              <p className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2'>Error</p>
                              <p className='text-red-400 text-sm font-mono bg-red-500/10 rounded px-3 py-2 border border-red-500/20'>
                                {log.errorMessage}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className='text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2'>Timing</p>
                            <p className='text-[var(--fg-secondary)] text-xs'>
                              Started: {formatTime(log.startedAt)}<br />
                              Completed: {formatTime(log.completedAt)}
                            </p>
                          </div>
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
