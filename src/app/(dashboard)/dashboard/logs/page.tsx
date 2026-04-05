import { getBaseUrl } from '@/lib/dashboard-api';
import LogsClient from './LogsClient';

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

interface LogsData {
  logs: LogEntry[];
  pagination: { page: number; pageSize: number; pageCount: number; total: number };
}

async function fetchLogs(): Promise<LogsData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/logs?pageSize=25`, { cache: 'no-store' });
  if (!res.ok) return { logs: [], pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 } };
  return res.json();
}

export default async function LogsPage() {
  const data = await fetchLogs();

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Application Logs</h1>
        <p className='text-sm text-[var(--fg-muted)] mt-1'>
          Detailed pipeline events and service logs with severity levels
        </p>
      </div>

      <LogsClient initialLogs={data.logs} initialPagination={data.pagination} />
    </div>
  );
}
