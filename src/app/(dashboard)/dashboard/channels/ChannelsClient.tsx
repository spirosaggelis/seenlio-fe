'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

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

interface Props {
  initialChannels: Channel[];
  categories: { id: string; name: string }[];
}

const PLATFORMS = ['youtube', 'tiktok', 'instagram', 'pinterest'] as const;

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-500/20 text-red-300 border-red-500/30',
  tiktok: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  instagram: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  pinterest: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

const PLATFORM_ICONS: Record<string, string> = {
  youtube: 'YT',
  tiktok: 'TT',
  instagram: 'IG',
  pinterest: 'PT',
};

function hasCredentials(account: PlatformAccount): boolean {
  return !!(account.credentials && Object.keys(account.credentials).length > 0);
}

function isTokenExpired(account: PlatformAccount): boolean {
  if (!account.tokenExpiresAt) return false;
  return new Date(account.tokenExpiresAt) < new Date();
}

export default function ChannelsClient({ initialChannels, categories }: Props) {
  const [channels, setChannels] = useState(initialChannels);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Channel form
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [editChannelId, setEditChannelId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');

  // Account form
  const [showAccountForm, setShowAccountForm] = useState<string | null>(null); // channel ID
  const [formPlatform, setFormPlatform] = useState<string>(PLATFORMS[0]);
  const [formAccountName, setFormAccountName] = useState('');

  // Expanded channels
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(initialChannels.map((c) => c.id)),
  );

  const searchParams = useSearchParams();

  // Show toast from OAuth redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) {
      setToast({ type: 'success', message: success });
      refreshChannels();
    } else if (error) {
      setToast({ type: 'error', message: error });
    }
  }, [searchParams]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function refreshChannels() {
    const res = await fetch('/api/dashboard/channels');
    const data = await res.json();
    setChannels(data.channels || []);
  }

  // ── Channel CRUD ──

  function openAddChannel() {
    setEditChannelId(null);
    setFormName('');
    setFormDescription('');
    setFormCategory(categories[0]?.id || '');
    setShowChannelForm(true);
  }

  function openEditChannel(channel: Channel) {
    setEditChannelId(channel.id);
    setFormName(channel.name);
    setFormDescription(channel.description || '');
    setFormCategory(channel.category?.id || '');
    setShowChannelForm(true);
  }

  async function saveChannel() {
    setSaving(true);
    try {
      if (editChannelId) {
        await fetch('/api/dashboard/channels', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editChannelId,
            name: formName,
            description: formDescription,
            categoryId: formCategory || undefined,
          }),
        });
      } else {
        await fetch('/api/dashboard/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            description: formDescription,
            categoryId: formCategory || undefined,
          }),
        });
      }
      await refreshChannels();
      setShowChannelForm(false);
      setToast({
        type: 'success',
        message: editChannelId ? 'Channel updated' : 'Channel created',
      });
    } catch {
      setToast({ type: 'error', message: 'Failed to save channel' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteChannel(id: string) {
    if (!confirm('Delete this channel and all its platform accounts?')) return;
    setSaving(true);
    try {
      await fetch(`/api/dashboard/channels?id=${id}`, { method: 'DELETE' });
      setChannels((prev) => prev.filter((c) => c.id !== id));
      setToast({ type: 'success', message: 'Channel deleted' });
    } finally {
      setSaving(false);
    }
  }

  // ── Platform Account CRUD ──

  function openAddAccount(channelId: string) {
    setShowAccountForm(channelId);
    setFormPlatform(PLATFORMS[0]);
    setFormAccountName('');
  }

  async function saveAccount() {
    if (!showAccountForm) return;
    setSaving(true);
    try {
      await fetch('/api/dashboard/channels/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: formPlatform,
          accountName: formAccountName,
          channelId: showAccountForm,
        }),
      });
      await refreshChannels();
      setShowAccountForm(null);
      setToast({ type: 'success', message: 'Account added' });
    } catch {
      setToast({ type: 'error', message: 'Failed to add account' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount(accountId: string) {
    if (!confirm('Delete this platform account?')) return;
    setSaving(true);
    try {
      await fetch(`/api/dashboard/channels/accounts?id=${accountId}`, {
        method: 'DELETE',
      });
      await refreshChannels();
      setToast({ type: 'success', message: 'Account deleted' });
    } catch {
      setToast({ type: 'error', message: 'Failed to delete account' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAccount(account: PlatformAccount) {
    setSaving(true);
    try {
      await fetch('/api/dashboard/channels/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id, isActive: !account.isActive }),
      });
      await refreshChannels();
    } finally {
      setSaving(false);
    }
  }

  // ── OAuth Connect ──

  function connectAccount(account: PlatformAccount) {
    // Match the host the user is actually on (avoids www vs apex cookie mismatch vs hardcoded fallback).
    const currentUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    if (account.platform === 'tiktok') {
      const clientKey = prompt('Enter your TikTok Client Key:');
      if (!clientKey) return;

      const redirectUri = `${currentUrl}/api/auth/tiktok/callback`;
      const authUrl =
        `https://www.tiktok.com/v2/auth/authorize/` +
        `?client_key=${encodeURIComponent(clientKey)}` +
        `&scope=video.publish,video.upload` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${account.id}`;
      window.location.href = authUrl;
    } else if (account.platform === 'youtube') {
      const clientId = prompt('Enter your Google Client ID:');
      if (!clientId) return;

      const redirectUri = `${currentUrl}/api/auth/youtube/callback`;
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload')}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${account.id}`;
      window.location.href = authUrl;
    } else if (account.platform === 'pinterest') {
      const redirectUri = `${currentUrl}/api/auth/pinterest/callback`;
      const authUrl =
        `https://www.pinterest.com/oauth/` +
        `?client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_PINTEREST_APP_ID || prompt('Enter your Pinterest App ID:') || '')}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=boards:read,boards:write,pins:read,pins:write,user_accounts:read` +
        `&state=${account.id}`;
      window.location.href = authUrl;
    } else if (account.platform === 'instagram') {
      // Manual credential entry for platforms without OAuth flow yet
      const json = prompt(
        `Paste credentials JSON for ${account.platform}:\n\n` +
          '{"access_token": "...", "ig_user_id": "..."}',
      );
      if (!json) return;
      try {
        const credentials = JSON.parse(json);
        fetch('/api/dashboard/channels/accounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: account.id, credentials }),
        }).then(() => {
          refreshChannels();
          setToast({
            type: 'success',
            message: `${account.platform} credentials saved`,
          });
        });
      } catch {
        setToast({ type: 'error', message: 'Invalid JSON' });
      }
    }
  }

  function toggleExpanded(channelId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  }

  return (
    <div className='space-y-6'>
      {/* Toast */}
      {toast && (
        <div
          className={[
            'px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium border',
            toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300',
          ].join(' ')}
        >
          {toast.message}
        </div>
      )}

      {/* Add Channel */}
      <div className='flex justify-end'>
        <button
          onClick={openAddChannel}
          className='px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)] bg-[var(--accent-purple)] text-white hover:opacity-90 transition-opacity'
        >
          + New Channel
        </button>
      </div>

      {/* Add/Edit Channel Form */}
      {showChannelForm && (
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-5'>
          <h3 className='text-sm font-semibold text-[var(--fg-primary)] mb-4'>
            {editChannelId ? 'Edit Channel' : 'New Channel'}
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='text-xs text-[var(--fg-muted)] block mb-1'>
                Name
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder='e.g. Gadgets EN'
                className='w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-2'
              />
            </div>
            <div>
              <label className='text-xs text-[var(--fg-muted)] block mb-1'>
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className='w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-2'
              >
                <option value=''>No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='text-xs text-[var(--fg-muted)] block mb-1'>
                Description
              </label>
              <input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder='Optional description'
                className='w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-2'
              />
            </div>
          </div>
          <div className='flex gap-2 mt-4'>
            <button
              onClick={saveChannel}
              disabled={saving || !formName.trim()}
              className='px-4 py-2 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--accent-purple)] text-white hover:opacity-90 transition-opacity disabled:opacity-50'
            >
              {editChannelId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => setShowChannelForm(false)}
              className='px-4 py-2 text-xs font-medium rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Channel list */}
      {channels.length === 0 && !showChannelForm && (
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-12 text-center'>
          <p className='text-[var(--fg-muted)]'>
            No channels yet. Create one to get started.
          </p>
        </div>
      )}

      {channels.map((channel) => (
        <div
          key={channel.id}
          className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden'
        >
          {/* Channel header */}
          <div
            className='flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors'
            onClick={() => toggleExpanded(channel.id)}
          >
            <div className='flex items-center gap-3'>
              <svg
                className={`w-4 h-4 text-[var(--fg-muted)] transition-transform ${expanded.has(channel.id) ? 'rotate-90' : ''}`}
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={2}
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M8.25 4.5l7.5 7.5-7.5 7.5'
                />
              </svg>
              <div>
                <h3 className='text-sm font-semibold text-[var(--fg-primary)]'>
                  {channel.name}
                </h3>
                <div className='flex items-center gap-2 mt-0.5'>
                  {channel.category && (
                    <span className='text-xs text-[var(--accent-purple-light)] bg-[var(--accent-purple)] bg-opacity-20 px-2 py-0.5 rounded'>
                      {channel.category.name}
                    </span>
                  )}
                  <span className='text-xs text-[var(--fg-muted)]'>
                    {channel.platformAccounts.length} account
                    {channel.platformAccounts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <div
              className='flex items-center gap-2'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Platform badges summary */}
              <div className='flex gap-1'>
                {channel.platformAccounts.map((acc) => (
                  <span
                    key={acc.id}
                    className={`inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-bold border ${PLATFORM_COLORS[acc.platform] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'} ${hasCredentials(acc) ? '' : 'opacity-40'}`}
                    title={`${acc.accountName} (${acc.platform})${hasCredentials(acc) ? ' - Connected' : ' - Not connected'}`}
                  >
                    {PLATFORM_ICONS[acc.platform] || '?'}
                  </span>
                ))}
              </div>
              <button
                onClick={() => openEditChannel(channel)}
                className='text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)] px-2 py-1'
              >
                Edit
              </button>
              <button
                onClick={() => deleteChannel(channel.id)}
                className='text-xs text-red-400 hover:text-red-300 px-2 py-1'
              >
                Delete
              </button>
            </div>
          </div>

          {/* Expanded: platform accounts */}
          {expanded.has(channel.id) && (
            <div className='border-t border-[var(--border-subtle)]'>
              {channel.platformAccounts.length === 0 && (
                <div className='px-5 py-6 text-center text-sm text-[var(--fg-muted)]'>
                  No platform accounts. Add one to start publishing.
                </div>
              )}

              {channel.platformAccounts.map((account) => {
                const connected = hasCredentials(account);
                const expired = isTokenExpired(account);

                return (
                  <div
                    key={account.id}
                    className='flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-tertiary)] transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold border ${PLATFORM_COLORS[account.platform] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}
                      >
                        {PLATFORM_ICONS[account.platform] || '?'}
                      </span>
                      <div>
                        <p className='text-sm font-medium text-[var(--fg-primary)]'>
                          {account.accountName}
                        </p>
                        <div className='flex items-center gap-2 mt-0.5'>
                          <span
                            className={`text-xs ${connected ? (expired ? 'text-orange-400' : 'text-green-400') : 'text-red-400'}`}
                          >
                            {connected
                              ? expired
                                ? 'Token expired'
                                : 'Connected'
                              : 'Not connected'}
                          </span>
                          {account.lastPostedAt && (
                            <span className='text-xs text-[var(--fg-muted)]'>
                              Last post:{' '}
                              {new Date(
                                account.lastPostedAt,
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      {/* Connect / Reconnect button */}
                      <button
                        onClick={() => connectAccount(account)}
                        className={[
                          'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all',
                          connected && !expired
                            ? 'border border-[var(--border-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'
                            : 'bg-[var(--accent-purple)] text-white hover:opacity-90',
                        ].join(' ')}
                      >
                        {connected
                          ? expired
                            ? 'Reconnect'
                            : 'Reconnect'
                          : 'Connect'}
                      </button>

                      {/* Active toggle */}
                      <button
                        onClick={() => toggleAccount(account)}
                        className={[
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          account.isActive
                            ? 'bg-[var(--accent-purple)]'
                            : 'bg-[var(--bg-tertiary)]',
                        ].join(' ')}
                        title={account.isActive ? 'Active' : 'Disabled'}
                      >
                        <span
                          className={[
                            'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                            account.isActive
                              ? 'translate-x-4'
                              : 'translate-x-0.5',
                          ].join(' ')}
                        />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteAccount(account.id)}
                        className='text-xs text-red-400 hover:text-red-300 transition-colors'
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add account button */}
              {showAccountForm === channel.id ? (
                <div className='px-5 py-4 bg-[var(--bg-tertiary)] border-t border-[var(--border-subtle)]'>
                  <div className='flex items-end gap-3'>
                    <div>
                      <label className='text-xs text-[var(--fg-muted)] block mb-1'>
                        Platform
                      </label>
                      <select
                        value={formPlatform}
                        onChange={(e) => setFormPlatform(e.target.value)}
                        className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-1.5'
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className='flex-1'>
                      <label className='text-xs text-[var(--fg-muted)] block mb-1'>
                        Account Name
                      </label>
                      <input
                        value={formAccountName}
                        onChange={(e) => setFormAccountName(e.target.value)}
                        placeholder='e.g. @seenlio_gadgets'
                        className='w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-1.5'
                      />
                    </div>
                    <button
                      onClick={saveAccount}
                      disabled={saving || !formAccountName.trim()}
                      className='px-4 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--accent-purple)] text-white hover:opacity-90 disabled:opacity-50'
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAccountForm(null)}
                      className='px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--fg-muted)]'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className='px-5 py-3 border-t border-[var(--border-subtle)]'>
                  <button
                    onClick={() => openAddAccount(channel.id)}
                    className='text-xs text-[var(--accent-purple-light)] hover:text-[var(--fg-primary)] transition-colors'
                  >
                    + Add Platform Account
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
