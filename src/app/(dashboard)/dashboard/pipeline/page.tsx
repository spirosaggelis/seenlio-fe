import KpiCard from '../_components/KpiCard';
import { getBaseUrl } from '@/lib/dashboard-api';
import PipelineClient from './PipelineClient';

interface PipelineData {
  targets: Target[];
  recentRuns: Run[];
  videosThisWeek: number;
  publishedThisWeek: number;
  pipelineEnabled: boolean;
  pipelineIntervalMinutes: number;
  categories: { id: string; name: string }[];
}

interface Target {
  id: string;
  source: string;
  videosPerPeriod: number;
  periodDays: number;
  discoveryLimit: number;
  isActive: boolean;
  category?: { id?: string; name?: string; data?: { id: string; name: string } };
}

interface Run {
  id: string;
  jobId: string;
  jobStatus: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  result: {
    discovered?: number;
    approved?: number;
    rejected?: number;
    videos_generated?: number;
    published?: number;
    errors?: number;
  };
  errorMessage?: string;
}

async function fetchPipeline(): Promise<PipelineData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/pipeline`, { cache: 'no-store' });
  if (!res.ok) {
    return {
      targets: [],
      recentRuns: [],
      videosThisWeek: 0,
      publishedThisWeek: 0,
      pipelineEnabled: false,
      pipelineIntervalMinutes: 30,
      categories: [],
    };
  }
  return res.json();
}

export default async function PipelinePage() {
  const data = await fetchPipeline();

  const lastRun = data.recentRuns[0];
  const lastRunLabel = lastRun
    ? new Date(lastRun.startedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Pipeline</h1>
        <p className='text-sm text-[var(--fg-muted)] mt-1'>
          Automated discover → approve → generate → publish
        </p>
      </div>

      {/* KPI cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <KpiCard label='Active Targets' value={data.targets.filter((t) => t.isActive).length} accent='purple' />
        <KpiCard label='Videos This Week' value={data.videosThisWeek} accent='cyan' />
        <KpiCard label='Published This Week' value={data.publishedThisWeek} accent='pink' />
        <KpiCard label='Last Run' value={lastRunLabel} accent='purple' />
      </div>

      {/* Interactive sections */}
      <PipelineClient
        initialTargets={data.targets}
        initialRuns={data.recentRuns}
        pipelineEnabled={data.pipelineEnabled}
        pipelineIntervalMinutes={data.pipelineIntervalMinutes}
        categories={data.categories}
      />
    </div>
  );
}
