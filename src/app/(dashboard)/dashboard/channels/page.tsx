import { getBaseUrl } from '@/lib/dashboard-api';
import ChannelsClient from './ChannelsClient';

interface PlatformAccount {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  credentials: Record<string, string> | null;
  tokenExpiresAt: string | null;
  lastPostedAt: string | null;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  category: { id: string; name: string } | null;
  platformAccounts: PlatformAccount[];
}

interface ChannelsData {
  channels: Channel[];
  categories: { id: string; name: string }[];
}

async function fetchChannels(): Promise<ChannelsData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/dashboard/channels`, { cache: 'no-store' });
  if (!res.ok) return { channels: [], categories: [] };
  return res.json();
}

export default async function ChannelsPage() {
  const data = await fetchChannels();

  const totalAccounts = data.channels.reduce((sum, ch) => sum + ch.platformAccounts.length, 0);
  const connectedAccounts = data.channels.reduce(
    (sum, ch) => sum + ch.platformAccounts.filter((a) => a.credentials && Object.keys(a.credentials).length > 0).length,
    0,
  );

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>Channels</h1>
        <p className='text-sm text-[var(--fg-muted)] mt-1'>
          Manage your channels and connect social platform accounts
        </p>
      </div>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4'>
          <p className='text-xs text-[var(--fg-muted)] uppercase tracking-wider'>Channels</p>
          <p className='text-2xl font-bold text-[var(--fg-primary)] mt-1'>{data.channels.length}</p>
        </div>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4'>
          <p className='text-xs text-[var(--fg-muted)] uppercase tracking-wider'>Platform Accounts</p>
          <p className='text-2xl font-bold text-[var(--fg-primary)] mt-1'>{totalAccounts}</p>
        </div>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4'>
          <p className='text-xs text-[var(--fg-muted)] uppercase tracking-wider'>Connected</p>
          <p className='text-2xl font-bold text-green-400 mt-1'>{connectedAccounts}</p>
        </div>
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4'>
          <p className='text-xs text-[var(--fg-muted)] uppercase tracking-wider'>Not Connected</p>
          <p className='text-2xl font-bold text-orange-400 mt-1'>{totalAccounts - connectedAccounts}</p>
        </div>
      </div>

      <ChannelsClient
        initialChannels={data.channels}
        categories={data.categories}
      />
    </div>
  );
}
