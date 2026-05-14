'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ListicleRow } from './page';

const STATUS_ORDER: Record<string, number> = {
  draft_ready: 0,
  proposed: 1,
  approved: 2,
  drafting: 3,
  published: 4,
  archived: 5,
};

const STATUS_BADGE: Record<string, string> = {
  proposed: 'bg-yellow-500/20 text-yellow-300',
  approved: 'bg-blue-500/20 text-blue-300',
  drafting: 'bg-indigo-500/20 text-indigo-300',
  draft_ready: 'bg-emerald-500/20 text-emerald-300',
  published: 'bg-purple-500/20 text-purple-300',
  archived: 'bg-gray-500/20 text-gray-300',
};

function fmt(score: number | null | undefined) {
  if (score == null) return '—';
  return Math.round(score).toString();
}

function priceTierLabel(t: string | null | undefined) {
  switch (t) {
    case 'tier_under_10':
      return '€ <10';
    case 'tier_10_30':
      return '€10–30';
    case 'tier_30_100':
      return '€30–100';
    case 'tier_100_plus':
      return '€100+';
    case 'any':
    case null:
    case undefined:
      return 'any';
    default:
      return t;
  }
}

interface Props {
  initial: ListicleRow[];
}

export default function ListiclesClient({ initial }: Props) {
  const [listicles, setListicles] = useState<ListicleRow[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [detail, setDetail] = useState<ListicleRow | null>(null);
  const [filter, setFilter] = useState<string>('all');

  async function refresh() {
    try {
      const res = await fetch('/api/dashboard/listicles', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setListicles(data.listicles || []);
      }
    } catch {
      /* swallow */
    }
  }

  async function runPlan() {
    setBusy('plan');
    setMsg(null);
    try {
      const res = await fetch('/api/dashboard/listicles/plan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: 'err', text: data.error || 'Plan failed.' });
      } else {
        setMsg({
          kind: 'ok',
          text: `Plan complete — ${data.written ?? 0} new proposals written. Refreshing…`,
        });
        await refresh();
      }
    } catch (e) {
      setMsg({ kind: 'err', text: String(e) });
    } finally {
      setBusy(null);
    }
  }

  async function runGenerateTop(n: number) {
    setBusy('generate-top');
    setMsg(null);
    try {
      const res = await fetch('/api/dashboard/listicles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ top: n }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: 'err', text: data.error || 'Generate failed.' });
      } else {
        setMsg({
          kind: 'ok',
          text: `Generated ${data.generated ?? 0} drafts. Review them before publishing.`,
        });
        await refresh();
      }
    } catch (e) {
      setMsg({ kind: 'err', text: String(e) });
    } finally {
      setBusy(null);
    }
  }

  async function generateOne(id: string) {
    setBusy(`gen-${id}`);
    setMsg(null);
    try {
      const res = await fetch('/api/dashboard/listicles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: 'err', text: data.error || 'Generate failed.' });
      } else {
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function publishOne(id: string) {
    setBusy(`pub-${id}`);
    try {
      const res = await fetch('/api/dashboard/listicles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg({ kind: 'err', text: data.error || 'Publish failed.' });
      } else {
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function approveOne(id: string) {
    setBusy(`appr-${id}`);
    try {
      const res = await fetch('/api/dashboard/listicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, listicleStatus: 'approved' }),
      });
      if (res.ok) await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function archiveOne(id: string) {
    setBusy(`arch-${id}`);
    try {
      const res = await fetch('/api/dashboard/listicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, listicleStatus: 'archived' }),
      });
      if (res.ok) await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deleteOne(id: string) {
    if (!confirm('Delete this listicle? This cannot be undone.')) return;
    setBusy(`del-${id}`);
    try {
      const res = await fetch(`/api/dashboard/listicles?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) await refresh();
    } finally {
      setBusy(null);
    }
  }

  const visible = useMemo(() => {
    const filtered =
      filter === 'all'
        ? listicles
        : listicles.filter((l) => l.listicleStatus === filter);
    return [...filtered].sort((a, b) => {
      const sa = STATUS_ORDER[a.listicleStatus] ?? 99;
      const sb = STATUS_ORDER[b.listicleStatus] ?? 99;
      if (sa !== sb) return sa - sb;
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });
  }, [listicles, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: listicles.length };
    for (const l of listicles) c[l.listicleStatus] = (c[l.listicleStatus] || 0) + 1;
    return c;
  }, [listicles]);

  return (
    <div className='space-y-6'>
      {msg && (
        <div
          className={[
            'rounded-md px-3 py-2 text-sm',
            msg.kind === 'ok'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/15 text-red-300 border border-red-500/30',
          ].join(' ')}
        >
          {msg.text}
        </div>
      )}

      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3'>
        <button
          type='button'
          disabled={busy === 'plan'}
          onClick={runPlan}
          className='inline-flex items-center gap-2 rounded-md bg-[var(--accent-purple)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50'
        >
          {busy === 'plan' ? 'Planning…' : 'Generate plan (15–20 ideas)'}
        </button>
        <button
          type='button'
          disabled={busy === 'generate-top'}
          onClick={() => runGenerateTop(5)}
          className='inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm font-medium text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50'
        >
          {busy === 'generate-top' ? 'Writing…' : 'Write top 5 drafts'}
        </button>
        <div className='ml-auto flex items-center gap-2'>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className='rounded-md border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-1.5 text-sm text-[var(--fg-primary)]'
          >
            <option value='all'>All ({counts.all || 0})</option>
            <option value='proposed'>Proposed ({counts.proposed || 0})</option>
            <option value='approved'>Approved ({counts.approved || 0})</option>
            <option value='draft_ready'>Draft ready ({counts.draft_ready || 0})</option>
            <option value='published'>Published ({counts.published || 0})</option>
            <option value='archived'>Archived ({counts.archived || 0})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]'>
        <table className='w-full text-sm'>
          <thead className='bg-[var(--bg-tertiary)] text-left text-xs uppercase tracking-wide text-[var(--fg-muted)]'>
            <tr>
              <th className='px-4 py-2'>Title</th>
              <th className='px-3 py-2'>Status</th>
              <th className='px-3 py-2'>Score</th>
              <th className='px-3 py-2'>Tier</th>
              <th className='px-3 py-2'>Products</th>
              <th className='px-3 py-2'>Keyword</th>
              <th className='px-3 py-2 text-right'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className='px-4 py-10 text-center text-[var(--fg-muted)]'>
                  No listicles yet. Click <strong>Generate plan</strong> to seed the
                  first 15–20 proposals from your approved products.
                </td>
              </tr>
            )}
            {visible.map((l) => {
              const productCount = l.products?.length || 0;
              return (
                <tr key={l.id} className='border-t border-[var(--border-subtle)]'>
                  <td className='px-4 py-3'>
                    <button
                      type='button'
                      onClick={() => setDetail(l)}
                      className='text-left text-[var(--fg-primary)] hover:underline'
                    >
                      {l.title}
                    </button>
                    {l.angleHook && (
                      <p className='mt-0.5 text-xs text-[var(--fg-muted)] line-clamp-1'>
                        {l.angleHook}
                      </p>
                    )}
                  </td>
                  <td className='px-3 py-3'>
                    <span
                      className={[
                        'inline-block rounded-full px-2 py-0.5 text-xs',
                        STATUS_BADGE[l.listicleStatus] || 'bg-gray-500/20 text-gray-300',
                      ].join(' ')}
                    >
                      {l.listicleStatus}
                    </span>
                  </td>
                  <td className='px-3 py-3 text-[var(--fg-secondary)]'>
                    {fmt(l.priorityScore)}
                  </td>
                  <td className='px-3 py-3 text-[var(--fg-secondary)]'>
                    {priceTierLabel(l.priceTier)}
                  </td>
                  <td className='px-3 py-3 text-[var(--fg-secondary)]'>{productCount}</td>
                  <td className='px-3 py-3 text-[var(--fg-muted)]'>
                    {l.targetKeyword || '—'}
                  </td>
                  <td className='px-3 py-3 text-right'>
                    <div className='inline-flex items-center gap-1'>
                      {l.listicleStatus === 'proposed' && (
                        <button
                          type='button'
                          disabled={busy === `appr-${l.id}`}
                          onClick={() => approveOne(l.id)}
                          className='rounded px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50'
                        >
                          Approve
                        </button>
                      )}
                      {(l.listicleStatus === 'proposed' ||
                        l.listicleStatus === 'approved') && (
                        <button
                          type='button'
                          disabled={busy === `gen-${l.id}`}
                          onClick={() => generateOne(l.id)}
                          className='rounded px-2 py-1 text-xs text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50'
                        >
                          {busy === `gen-${l.id}` ? 'Writing…' : 'Write'}
                        </button>
                      )}
                      {l.listicleStatus === 'draft_ready' && (
                        <button
                          type='button'
                          disabled={busy === `pub-${l.id}`}
                          onClick={() => publishOne(l.id)}
                          className='rounded px-2 py-1 text-xs text-purple-300 hover:bg-purple-500/10 disabled:opacity-50'
                        >
                          {busy === `pub-${l.id}` ? '…' : 'Publish'}
                        </button>
                      )}
                      {l.listicleStatus === 'published' && (
                        <a
                          href={`/lists/${l.slug}`}
                          target='_blank'
                          rel='noreferrer'
                          className='rounded px-2 py-1 text-xs text-purple-300 hover:bg-purple-500/10'
                        >
                          View
                        </a>
                      )}
                      {l.listicleStatus !== 'archived' && (
                        <button
                          type='button'
                          disabled={busy === `arch-${l.id}`}
                          onClick={() => archiveOne(l.id)}
                          className='rounded px-2 py-1 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50'
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type='button'
                        disabled={busy === `del-${l.id}`}
                        onClick={() => deleteOne(l.id)}
                        className='rounded px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50'
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail && (
        <ListicleDetailDrawer
          id={detail.id}
          onClose={() => setDetail(null)}
          onChange={refresh}
        />
      )}
    </div>
  );
}

// ── Detail drawer ────────────────────────────────────────────────────────

interface FullListicle {
  id: string;
  documentId?: string;
  title?: string;
  slug?: string;
  listicleStatus?: string;
  targetKeyword?: string;
  longtailKeywords?: string[];
  searchIntent?: string;
  priceTier?: string;
  sourcePlatformFilter?: string;
  angleHook?: string;
  priorityScore?: number;
  priorityRationale?: string;
  intro?: string;
  howWePicked?: string;
  outro?: string;
  items?: Array<{
    position?: number;
    productCode?: string;
    productName?: string;
    headline?: string;
    commentary?: string;
    tag?: string;
  }>;
  products?: Array<{
    documentId?: string;
    productCode?: string;
    name?: string;
    slug?: string;
  }>;
  generationLog?: Record<string, unknown>;
}

function ListicleDetailDrawer({
  id,
  onClose,
  onChange,
}: {
  id: string;
  onClose: () => void;
  onChange: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FullListicle | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/listicles/${id}`, { cache: 'no-store' });
      const body = await res.json();
      const listicle = body.listicle?.attributes
        ? { ...body.listicle.attributes, id, documentId: id }
        : body.listicle
        ? { ...body.listicle, id, documentId: id }
        : null;
      setEditing(listicle);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: editing.title,
        intro: editing.intro,
        howWePicked: editing.howWePicked,
        outro: editing.outro,
        targetKeyword: editing.targetKeyword,
        angleHook: editing.angleHook,
        items: editing.items,
      };
      const res = await fetch(`/api/dashboard/listicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await load();
        onChange();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className='fixed inset-0 z-40 flex items-stretch justify-end bg-black/60'
      onClick={onClose}
    >
      <div
        className='h-full w-full max-w-2xl overflow-y-auto bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] p-6'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-[var(--fg-primary)]'>
            Listicle detail
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'
          >
            ✕
          </button>
        </div>
        {loading || !editing ? (
          <p className='text-[var(--fg-muted)]'>Loading…</p>
        ) : (
          <div className='space-y-4 text-sm'>
            <Field label='Title'>
              <input
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className='w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--fg-primary)]'
              />
            </Field>
            <div className='grid grid-cols-2 gap-3'>
              <Field label='Status'>
                <code className='text-xs text-[var(--fg-secondary)]'>
                  {editing.listicleStatus}
                </code>
              </Field>
              <Field label='Slug'>
                <code className='text-xs text-[var(--fg-secondary)]'>
                  {editing.slug}
                </code>
              </Field>
              <Field label='Score'>
                <code className='text-xs text-[var(--fg-secondary)]'>
                  {Math.round(editing.priorityScore || 0)}
                </code>
              </Field>
              <Field label='Price tier'>
                <code className='text-xs text-[var(--fg-secondary)]'>
                  {editing.priceTier}
                </code>
              </Field>
            </div>
            <Field label='Target keyword'>
              <input
                value={editing.targetKeyword || ''}
                onChange={(e) =>
                  setEditing({ ...editing, targetKeyword: e.target.value })
                }
                className='w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--fg-primary)]'
              />
            </Field>
            <Field label='Angle / hook'>
              <textarea
                rows={2}
                value={editing.angleHook || ''}
                onChange={(e) =>
                  setEditing({ ...editing, angleHook: e.target.value })
                }
                className='w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--fg-primary)]'
              />
            </Field>
            {editing.priorityRationale && (
              <Field label='Why this ranks here'>
                <p className='text-xs italic text-[var(--fg-muted)]'>
                  {editing.priorityRationale}
                </p>
              </Field>
            )}
            <Field label='Intro'>
              <textarea
                rows={4}
                value={editing.intro || ''}
                onChange={(e) => setEditing({ ...editing, intro: e.target.value })}
                className='w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--fg-primary)]'
              />
            </Field>

            <div>
              <h3 className='mb-2 text-xs uppercase tracking-wide text-[var(--fg-muted)]'>
                Items ({editing.items?.length || 0})
              </h3>
              <div className='space-y-3'>
                {(editing.items || []).map((item, idx) => (
                  <div
                    key={`${item.productCode}-${idx}`}
                    className='rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3'
                  >
                    <div className='flex items-baseline justify-between gap-2'>
                      <span className='text-xs text-[var(--fg-muted)]'>
                        #{item.position ?? idx + 1} · {item.productCode}
                        {item.tag ? ` · ${item.tag}` : ''}
                      </span>
                    </div>
                    <input
                      value={item.headline || ''}
                      onChange={(e) => {
                        const next = [...(editing.items || [])];
                        next[idx] = { ...item, headline: e.target.value };
                        setEditing({ ...editing, items: next });
                      }}
                      className='mt-1 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-1 text-sm text-[var(--fg-primary)]'
                      placeholder='Headline'
                    />
                    <p className='mt-1 text-xs text-[var(--fg-muted)]'>
                      {item.productName}
                    </p>
                    <textarea
                      rows={3}
                      value={item.commentary || ''}
                      onChange={(e) => {
                        const next = [...(editing.items || [])];
                        next[idx] = { ...item, commentary: e.target.value };
                        setEditing({ ...editing, items: next });
                      }}
                      className='mt-1 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-1 text-sm text-[var(--fg-primary)]'
                    />
                  </div>
                ))}
              </div>
            </div>

            <Field label='How we picked'>
              <textarea
                rows={4}
                value={editing.howWePicked || ''}
                onChange={(e) =>
                  setEditing({ ...editing, howWePicked: e.target.value })
                }
                className='w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--fg-primary)]'
              />
            </Field>
            <Field label='Outro'>
              <textarea
                rows={3}
                value={editing.outro || ''}
                onChange={(e) => setEditing({ ...editing, outro: e.target.value })}
                className='w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--fg-primary)]'
              />
            </Field>

            <div className='sticky bottom-0 -mx-6 mt-6 flex justify-end gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] px-6 py-3'>
              <button
                type='button'
                onClick={onClose}
                className='rounded border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)]'
              >
                Close
              </button>
              <button
                type='button'
                onClick={save}
                disabled={saving}
                className='rounded bg-[var(--accent-purple)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50'
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className='block'>
      <span className='mb-1 block text-xs uppercase tracking-wide text-[var(--fg-muted)]'>
        {label}
      </span>
      {children}
    </label>
  );
}
