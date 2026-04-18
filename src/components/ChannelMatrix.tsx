import { getChannels } from '@/lib/strapi';

interface PlatformAccount {
  id: number;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'pinterest';
  accountName: string;
  accountId?: string;
  isActive?: boolean;
}

interface ChannelData {
  id: number;
  name: string;
  slug?: string;
  isActive?: boolean;
  category?: { id: number; name: string; slug: string } | null;
  platformAccounts?: PlatformAccount[];
}

function profileUrl(platform: string, accountName: string, accountId?: string): string | null {
  const handle = accountName.replace(/^@/, '').trim();
  if (!handle) return null;
  switch (platform) {
    case 'youtube':
      if (accountId && /^UC[A-Za-z0-9_-]+$/.test(accountId)) {
        return `https://www.youtube.com/channel/${accountId}`;
      }
      return `https://www.youtube.com/@${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'pinterest':
      return `https://www.pinterest.com/${handle}`;
    default:
      return null;
  }
}

const PLATFORM_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  youtube: {
    label: 'YouTube',
    color: 'hover:text-[#FF0000] hover:border-[#FF0000]/40',
    icon: (
      <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
        <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
      </svg>
    ),
  },
  tiktok: {
    label: 'TikTok',
    color: 'hover:text-[#25F4EE] hover:border-[#25F4EE]/40',
    icon: (
      <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
        <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z' />
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    color: 'hover:text-[#E1306C] hover:border-[#E1306C]/40',
    icon: (
      <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
        <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
      </svg>
    ),
  },
  pinterest: {
    label: 'Pinterest',
    color: 'hover:text-[#E60023] hover:border-[#E60023]/40',
    icon: (
      <svg viewBox='0 0 24 24' fill='currentColor' className='w-4 h-4'>
        <path d='M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z' />
      </svg>
    ),
  },
};

export default async function ChannelMatrix() {
  let channels: ChannelData[] = [];
  try {
    const res = await getChannels();
    channels = ((res.data || []) as ChannelData[]).filter(
      (c) => c.isActive !== false && c.category,
    );
  } catch {
    // Strapi may be unavailable — hide the section gracefully
    return null;
  }

  if (channels.length === 0) return null;

  const sorted = [...channels].sort((a, b) =>
    (a.category?.name ?? '').localeCompare(b.category?.name ?? ''),
  );

  return (
    <div className='mt-14'>
      <div className='flex items-center gap-3 mb-6'>
        <span className='text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fg-primary)]'>
          Our Channels
        </span>
        <div className='h-px flex-1 bg-linear-to-r from-purple-500/40 via-cyan-500/20 to-transparent' />
        <span className='text-[10px] text-[var(--fg-faint)] uppercase tracking-wider'>
          One per category
        </span>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {sorted.map((ch) => {
          const accounts = (ch.platformAccounts || []).filter(
            (a) => a.isActive !== false,
          );
          return (
            <div
              key={ch.id}
              className='group relative rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-purple-500/30 transition-colors p-4 overflow-hidden'
            >
              <div
                aria-hidden
                className='pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity'
              />
              <div className='relative flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-[10px] uppercase tracking-wider text-[var(--fg-faint)]'>
                    {ch.category?.name}
                  </p>
                  <p className='text-sm font-semibold text-[var(--fg-primary)] truncate'>
                    {ch.name}
                  </p>
                </div>
                <div className='flex items-center gap-1.5'>
                  {accounts.length === 0 && (
                    <span className='text-[10px] text-[var(--fg-faint)] italic'>
                      coming soon
                    </span>
                  )}
                  {accounts.map((acc) => {
                    const meta = PLATFORM_META[acc.platform];
                    if (!meta) return null;
                    const url = profileUrl(acc.platform, acc.accountName, acc.accountId);
                    if (!url) return null;
                    return (
                      <a
                        key={acc.id}
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={`${meta.label} — ${acc.accountName}`}
                        title={`${meta.label} · @${acc.accountName.replace(/^@/, '')}`}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 transition-colors ${meta.color}`}
                      >
                        {meta.icon}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
