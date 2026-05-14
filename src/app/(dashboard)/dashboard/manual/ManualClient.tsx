'use client';

import { useState } from 'react';

interface ManualProduct {
  id: string;
  name: string;
  productCode: string;
  productStatus: string;
  sourcePlatform: string;
  sourceUrl: string;
  externalId: string;
  videoState?: string;
  sitePublishedAt?: string | null;
  createdAt: string;
}

interface Props {
  initialProducts: ManualProduct[];
  categories: { id: string; name: string }[];
}

function platformBadge(platform: string): string {
  switch (platform) {
    case 'amazon':
      return 'bg-orange-500/20 text-orange-300';
    case 'aliexpress':
      return 'bg-red-500/20 text-red-300';
    case 'temu':
      return 'bg-blue-500/20 text-blue-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'discovered':
      return 'bg-yellow-500/20 text-yellow-300';
    case 'approved':
      return 'bg-emerald-500/20 text-emerald-300';
    case 'published':
      return 'bg-purple-500/20 text-purple-300';
    case 'rejected':
      return 'bg-red-500/20 text-red-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
}

export default function ManualClient({ initialProducts, categories }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function refresh() {
    try {
      const res = await fetch('/api/dashboard/products/manual', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      /* swallow */
    }
  }

  async function submit() {
    if (!url.trim()) {
      setMessage({ kind: 'err', text: 'Paste a product URL first.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/dashboard/products/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), categoryId: categoryId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: 'err',
          text: data.error || `Failed (${res.status})`,
        });
      } else {
        setMessage({
          kind: 'ok',
          text: `Queued ${data.productCode} (${data.platform}). Pipeline will scrape & publish on next cycle.`,
        });
        setUrl('');
        await refresh();
      }
    } catch (err) {
      setMessage({ kind: 'err', text: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='space-y-6'>
      {/* Submit card */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-5 space-y-3'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
          Add product by URL
        </h2>
        <div className='flex flex-col md:flex-row gap-3'>
          <input
            type='url'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='https://www.amazon.com/dp/B0… or https://www.aliexpress.com/item/… or https://www.temu.com/…'
            disabled={submitting}
            className='flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-2 placeholder:text-[var(--fg-muted)]'
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={submitting || categories.length === 0}
            className='bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-2'
          >
            <option value=''>No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={submit}
            disabled={submitting}
            className='px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)] bg-[var(--accent-purple)] text-white hover:opacity-90 transition-opacity disabled:opacity-50'
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
        {message && (
          <p
            className={[
              'text-xs',
              message.kind === 'ok' ? 'text-emerald-400' : 'text-red-400',
            ].join(' ')}
          >
            {message.text}
          </p>
        )}
      </div>

      {/* Recent list */}
      <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]'>
        <div className='flex items-center justify-between p-5 border-b border-[var(--border-subtle)]'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
            Recent manual products
          </h2>
          <button
            onClick={refresh}
            className='text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-colors'
          >
            Refresh
          </button>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-xs text-[var(--fg-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)]'>
                <th className='text-left px-5 py-3'>Code</th>
                <th className='text-left px-5 py-3'>Platform</th>
                <th className='text-left px-5 py-3'>Name</th>
                <th className='text-left px-5 py-3'>Status</th>
                <th className='text-left px-5 py-3'>Video</th>
                <th className='text-left px-5 py-3'>Added</th>
                <th className='text-right px-5 py-3'>Source</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className='px-5 py-8 text-center text-[var(--fg-muted)]'>
                    No manual products yet.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr
                  key={p.id}
                  className='border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors'
                >
                  <td className='px-5 py-3 font-mono text-xs text-[var(--fg-primary)]'>
                    {p.productCode}
                  </td>
                  <td className='px-5 py-3'>
                    <span
                      className={[
                        'inline-block px-2 py-0.5 rounded text-xs font-medium',
                        platformBadge(p.sourcePlatform),
                      ].join(' ')}
                    >
                      {p.sourcePlatform}
                    </span>
                  </td>
                  <td className='px-5 py-3 text-[var(--fg-primary)] max-w-md truncate'>
                    {p.name}
                  </td>
                  <td className='px-5 py-3'>
                    <span
                      className={[
                        'inline-block px-2 py-0.5 rounded text-xs font-medium',
                        statusBadge(p.productStatus),
                      ].join(' ')}
                    >
                      {p.productStatus}
                    </span>
                  </td>
                  <td className='px-5 py-3 text-xs text-[var(--fg-muted)]'>
                    {p.videoState || '—'}
                  </td>
                  <td className='px-5 py-3 text-xs text-[var(--fg-muted)]'>
                    {new Date(p.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className='px-5 py-3 text-right'>
                    <a
                      href={p.sourceUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs text-[var(--accent-purple-light)] hover:underline'
                    >
                      Open ↗
                    </a>
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
