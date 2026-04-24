'use client';

import { useState } from 'react';

interface ChannelTarget {
  id: string;
  videosPerPeriod: number;
  periodDays: number;
  isActive: boolean;
  channel?: { id?: string; name?: string; data?: { id: string; name: string } };
}

interface Props {
  initialTargets: ChannelTarget[];
  channels: { id: string; name: string }[];
}

function getChannelName(t: ChannelTarget): string {
  if (t.channel?.name) return t.channel.name;
  if (t.channel?.data?.name) return t.channel.data.name;
  return 'Unknown';
}

function getChannelId(t: ChannelTarget): string {
  if (t.channel?.id) return t.channel.id;
  if (t.channel?.data?.id) return t.channel.data.id;
  return '';
}

export default function ChannelTargetsClient({ initialTargets, channels }: Props) {
  const [targets, setTargets] = useState(initialTargets);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formChannel, setFormChannel] = useState(channels[0]?.id || '');
  const [formVideos, setFormVideos] = useState(1);
  const [formPeriod, setFormPeriod] = useState(1);

  function openAddForm() {
    setEditId(null);
    setFormChannel(channels[0]?.id || '');
    setFormVideos(1);
    setFormPeriod(1);
    setShowForm(true);
  }

  function openEditForm(t: ChannelTarget) {
    setEditId(t.id);
    setFormChannel(getChannelId(t));
    setFormVideos(t.videosPerPeriod);
    setFormPeriod(t.periodDays);
    setShowForm(true);
  }

  async function refresh() {
    const res = await fetch('/api/dashboard/pipeline');
    const data = await res.json();
    setTargets(data.channelTargets || []);
  }

  async function saveTarget() {
    setSaving(true);
    try {
      const payload = {
        channel: formChannel || undefined,
        videosPerPeriod: formVideos,
        periodDays: formPeriod,
        isActive: true,
      };
      if (editId) {
        await fetch('/api/dashboard/pipeline/channel-targets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        await fetch('/api/dashboard/pipeline/channel-targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await refresh();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTarget(id: string) {
    if (!confirm('Delete this channel target?')) return;
    setSaving(true);
    try {
      await fetch(`/api/dashboard/pipeline/channel-targets?id=${id}`, { method: 'DELETE' });
      setTargets((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setSaving(false);
    }
  }

  async function toggleTarget(t: ChannelTarget) {
    setSaving(true);
    try {
      await fetch('/api/dashboard/pipeline/channel-targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
      });
      setTargets((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, isActive: !x.isActive } : x)),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]'>
      <div className='flex items-center justify-between p-5 border-b border-[var(--border-subtle)]'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
          Channel Targets
        </h2>
        <button
          onClick={openAddForm}
          className='px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--accent-purple)] text-white hover:opacity-90 transition-opacity'
        >
          + Add Target
        </button>
      </div>

      {showForm && (
        <div className='p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            <div>
              <label className='text-xs text-[var(--fg-muted)] block mb-1'>Channel</label>
              <select
                value={formChannel}
                onChange={(e) => setFormChannel(e.target.value)}
                className='w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-2 py-1.5'
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='text-xs text-[var(--fg-muted)] block mb-1'>Videos / Period</label>
              <input
                type='number'
                min={1}
                max={50}
                value={formVideos}
                onChange={(e) => setFormVideos(Number(e.target.value))}
                className='w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-2 py-1.5'
              />
            </div>
            <div>
              <label className='text-xs text-[var(--fg-muted)] block mb-1'>Period (days)</label>
              <input
                type='number'
                min={1}
                max={30}
                value={formPeriod}
                onChange={(e) => setFormPeriod(Number(e.target.value))}
                className='w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-2 py-1.5'
              />
            </div>
            <div className='flex items-end gap-2'>
              <button
                onClick={saveTarget}
                disabled={saving}
                className='px-4 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--accent-purple)] text-white hover:opacity-90 transition-opacity'
              >
                {editId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className='px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-xs text-[var(--fg-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)]'>
              <th className='text-left px-5 py-3'>Channel</th>
              <th className='text-center px-5 py-3'>Videos / Period</th>
              <th className='text-center px-5 py-3'>Period</th>
              <th className='text-center px-5 py-3'>Active</th>
              <th className='text-right px-5 py-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {targets.length === 0 && (
              <tr>
                <td colSpan={5} className='px-5 py-8 text-center text-[var(--fg-muted)]'>
                  No channel targets configured. Click &ldquo;Add Target&rdquo; to set a per-channel video throughput.
                </td>
              </tr>
            )}
            {targets.map((t) => (
              <tr
                key={t.id}
                className='border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors'
              >
                <td className='px-5 py-3 text-[var(--fg-primary)] font-medium'>{getChannelName(t)}</td>
                <td className='px-5 py-3 text-center text-[var(--fg-primary)]'>{t.videosPerPeriod}</td>
                <td className='px-5 py-3 text-center text-[var(--fg-muted)]'>{t.periodDays}d</td>
                <td className='px-5 py-3 text-center'>
                  <button
                    onClick={() => toggleTarget(t)}
                    className={[
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      t.isActive ? 'bg-[var(--accent-purple)]' : 'bg-[var(--bg-tertiary)]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                        t.isActive ? 'translate-x-4' : 'translate-x-0.5',
                      ].join(' ')}
                    />
                  </button>
                </td>
                <td className='px-5 py-3 text-right'>
                  <button
                    onClick={() => openEditForm(t)}
                    className='text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)] mr-3 transition-colors'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTarget(t.id)}
                    className='text-xs text-red-400 hover:text-red-300 transition-colors'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
