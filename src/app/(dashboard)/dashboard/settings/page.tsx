import { getBaseUrl } from '@/lib/dashboard-api';
import SettingsClient from './SettingsClient';

export interface PlatformSettings {
  pipelineEnabled: boolean;
  pipelineIntervalMinutes: number;
  logLevel: string;
  minTrendScore: number;
  minRating: number;
  maxPrice: number;
  defaultApprovalPrompt: string;
}

async function fetchSettings(): Promise<PlatformSettings> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/settings`, { cache: 'no-store' });
  if (!res.ok) {
    return {
      pipelineEnabled: false,
      pipelineIntervalMinutes: 30,
      logLevel: 'info',
      minTrendScore: 20,
      minRating: 3.5,
      maxPrice: 200,
      defaultApprovalPrompt: '',
    };
  }
  const data = await res.json();
  return data.settings;
}

export default async function SettingsPage() {
  const settings = await fetchSettings();

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Settings</h1>
        <p className='text-sm text-[var(--fg-muted)] mt-1'>
          Global platform configuration
        </p>
      </div>

      <SettingsClient initial={settings} />
    </div>
  );
}
