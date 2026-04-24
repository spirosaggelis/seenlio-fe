'use client';

import { useState } from 'react';

interface Target {
  id: string;
  source: string;
  productsPerPeriod: number;
  videosPerPeriod: number;
  periodDays: number;
  discoveryLimit: number;
  isActive: boolean;
  category?: { id?: string; name?: string; data?: { id: string; name: string } };
}

interface Props {
  initialTargets: Target[];
  pipelineEnabled: boolean;
  pipelineIntervalMinutes: number;
  categories: { id: string; name: string }[];
}

const SOURCES = ['amazon', 'aliexpress', 'temu'] as const;
const INTERVALS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
];

function getCategoryName(target: Target): string {
  if (target.category?.name) return target.category.name;
  if (target.category?.data?.name) return target.category.data.name;
  return 'Unknown';
}

function getCategoryId(target: Target): string {
  if (target.category?.id) return target.category.id;
  if (target.category?.data?.id) return target.category.data.id;
  return '';
}

export default function PipelineClient({
  initialTargets,
  pipelineEnabled: initialEnabled,
  pipelineIntervalMinutes: initialInterval,
  categories,
}: Props) {
  const [targets, setTargets] = useState(initialTargets);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [interval, setInterval] = useState(initialInterval);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('');
  const [formSource, setFormSource] = useState<string>(SOURCES[0]);
  const [formProducts, setFormProducts] = useState(3);
  const [formVideos, setFormVideos] = useState(1);
  const [formPeriod, setFormPeriod] = useState(1);
  const [formLimit, setFormLimit] = useState(20);

  async function togglePipeline() {
    const next = !enabled;
    setSaving(true);
    try {
      await fetch('/api/dashboard/pipeline/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineEnabled: next }),
      });
      setEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  async function updateInterval(value: number) {
    setSaving(true);
    try {
      await fetch('/api/dashboard/pipeline/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineIntervalMinutes: value }),
      });
      setInterval(value);
    } finally {
      setSaving(false);
    }
  }

  function openAddForm() {
    setEditId(null);
    setFormCategory(categories[0]?.id || '');
    setFormSource(SOURCES[0]);
    setFormProducts(3);
    setFormVideos(1);
    setFormPeriod(1);
    setFormLimit(20);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(target: Target) {
    setEditId(target.id);
    setFormCategory(getCategoryId(target));
    setFormSource(target.source);
    setFormProducts(target.productsPerPeriod ?? 3);
    setFormVideos(target.videosPerPeriod ?? 1);
    setFormPeriod(target.periodDays);
    setFormLimit(target.discoveryLimit);
    setFormError(null);
    setShowForm(true);
  }

  async function saveTarget() {
    if (formProducts < formVideos) {
      setFormError('Products to publish must be ≥ videos per period');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        category: formCategory || undefined,
        source: formSource,
        productsPerPeriod: formProducts,
        videosPerPeriod: formVideos,
        periodDays: formPeriod,
        discoveryLimit: formLimit,
        isActive: true,
      };

      if (editId) {
        await fetch('/api/dashboard/pipeline/targets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        await fetch('/api/dashboard/pipeline/targets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      // Refresh targets
      const res = await fetch('/api/dashboard/pipeline');
      const data = await res.json();
      setTargets(data.targets || []);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTarget(id: string) {
    if (!confirm('Delete this pipeline target?')) return;
    setSaving(true);
    try {
      await fetch(`/api/dashboard/pipeline/targets?id=${id}`, { method: 'DELETE' });
      setTargets((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setSaving(false);
    }
  }

  async function toggleTarget(target: Target) {
    setSaving(true);
    try {
      await fetch('/api/dashboard/pipeline/targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, isActive: !target.isActive }),
      });
      setTargets((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, isActive: !t.isActive } : t)),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='space-y-6'>
      {/* Pipeline controls */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-5'>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-4'>
            <button
              onClick={togglePipeline}
              disabled={saving}
              className={[
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                enabled ? 'bg-[var(--accent-purple)]' : 'bg-[var(--bg-tertiary)]',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-5 w-5 rounded-full bg-white transition-transform',
                  enabled ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
            <span className='text-sm font-medium text-[var(--fg-primary)]'>
              Pipeline {enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <div className='flex items-center gap-3'>
            <label className='text-xs text-[var(--fg-muted)]'>Run every</label>
            <select
              value={interval}
              onChange={(e) => updateInterval(Number(e.target.value))}
              disabled={saving}
              className='bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-1.5'
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product targets (was Pipeline Targets) */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]'>
        <div className='flex items-center justify-between p-5 border-b border-[var(--border-subtle)]'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
            Product Targets
          </h2>
          <button
            onClick={openAddForm}
            className='px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--accent-purple)] text-white hover:opacity-90 transition-opacity'
          >
            + Add Target
          </button>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className='p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]'>
            <div className='grid grid-cols-2 md:grid-cols-7 gap-3'>
              <div>
                <label className='text-xs text-[var(--fg-muted)] block mb-1'>Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className='w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-2 py-1.5'
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='text-xs text-[var(--fg-muted)] block mb-1'>Source</label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className='w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-2 py-1.5'
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='text-xs text-[var(--fg-muted)] block mb-1'>Products / Period</label>
                <input
                  type='number'
                  min={1}
                  max={200}
                  value={formProducts}
                  onChange={(e) => setFormProducts(Number(e.target.value))}
                  className='w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-2 py-1.5'
                />
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
              <div>
                <label className='text-xs text-[var(--fg-muted)] block mb-1'>Max Retries</label>
                <input
                  type='number'
                  min={1}
                  max={50}
                  value={formLimit}
                  onChange={(e) => setFormLimit(Number(e.target.value))}
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
            {formError && (
              <p className='mt-3 text-xs text-red-400'>{formError}</p>
            )}
          </div>
        )}

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-xs text-[var(--fg-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)]'>
                <th className='text-left px-5 py-3'>Category</th>
                <th className='text-left px-5 py-3'>Source</th>
                <th className='text-center px-5 py-3'>Products</th>
                <th className='text-center px-5 py-3'>Videos</th>
                <th className='text-center px-5 py-3'>Period</th>
                <th className='text-center px-5 py-3'>Max Retries</th>
                <th className='text-center px-5 py-3'>Active</th>
                <th className='text-right px-5 py-3'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {targets.length === 0 && (
                <tr>
                  <td colSpan={8} className='px-5 py-8 text-center text-[var(--fg-muted)]'>
                    No pipeline targets configured. Click &ldquo;Add Target&rdquo; to get started.
                  </td>
                </tr>
              )}
              {targets.map((target) => (
                <tr
                  key={target.id}
                  className='border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors'
                >
                  <td className='px-5 py-3 text-[var(--fg-primary)] font-medium'>
                    {getCategoryName(target)}
                  </td>
                  <td className='px-5 py-3'>
                    <span
                      className={[
                        'inline-block px-2 py-0.5 rounded text-xs font-medium',
                        target.source === 'amazon'
                          ? 'bg-orange-500/20 text-orange-300'
                          : target.source === 'aliexpress'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-blue-500/20 text-blue-300',
                      ].join(' ')}
                    >
                      {target.source}
                    </span>
                  </td>
                  <td className='px-5 py-3 text-center text-[var(--fg-primary)]'>
                    {target.productsPerPeriod ?? '-'}
                  </td>
                  <td className='px-5 py-3 text-center text-[var(--fg-primary)]'>
                    {target.videosPerPeriod ?? '-'}
                  </td>
                  <td className='px-5 py-3 text-center text-[var(--fg-muted)]'>
                    {target.periodDays}d
                  </td>
                  <td className='px-5 py-3 text-center text-[var(--fg-muted)]'>
                    {target.discoveryLimit}
                  </td>
                  <td className='px-5 py-3 text-center'>
                    <button
                      onClick={() => toggleTarget(target)}
                      className={[
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        target.isActive ? 'bg-[var(--accent-purple)]' : 'bg-[var(--bg-tertiary)]',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                          target.isActive ? 'translate-x-4' : 'translate-x-0.5',
                        ].join(' ')}
                      />
                    </button>
                  </td>
                  <td className='px-5 py-3 text-right'>
                    <button
                      onClick={() => openEditForm(target)}
                      className='text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)] mr-3 transition-colors'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTarget(target.id)}
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

    </div>
  );
}
