'use client';

import { useState } from 'react';

interface PlatformSettings {
  pipelineEnabled: boolean;
  pipelineIntervalMinutes: number;
  logLevel: string;
  minTrendScore: number;
  minRating: number;
  maxPrice: number;
  defaultApprovalPrompt: string;
}

interface Props {
  initial: PlatformSettings;
}

const INTERVALS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
];

const LOG_LEVELS = [
  { value: 'debug', label: 'Debug', desc: 'All logs including debug details' },
  { value: 'info', label: 'Info', desc: 'Normal operations and above' },
  { value: 'warning', label: 'Warning', desc: 'Warnings and errors only' },
  { value: 'error', label: 'Error', desc: 'Only critical errors' },
];

export default function SettingsClient({ initial }: Props) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function updateField(field: string, value: unknown) {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaving(field);
    setSaved(null);
    try {
      await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      setSaved(field);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  }

  const inputClass =
    'w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-2 focus:outline-none focus:border-[var(--accent-purple)]';
  const selectClass =
    'bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-sm text-[var(--fg-primary)] px-3 py-2';

  return (
    <div className='space-y-6'>
      {/* Pipeline Section */}
      <section className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]'>
        <div className='p-5 border-b border-[var(--border-subtle)]'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
            Pipeline
          </h2>
        </div>
        <div className='p-5 space-y-5'>
          {/* Pipeline enabled */}
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-[var(--fg-primary)]'>Pipeline Enabled</p>
              <p className='text-xs text-[var(--fg-muted)] mt-0.5'>
                Enable or disable the automated pipeline
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => updateField('pipelineEnabled', !settings.pipelineEnabled)}
                disabled={saving === 'pipelineEnabled'}
                className={[
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  settings.pipelineEnabled ? 'bg-[var(--accent-purple)]' : 'bg-[var(--bg-tertiary)]',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-5 w-5 rounded-full bg-white transition-transform',
                    settings.pipelineEnabled ? 'translate-x-6' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
              <SaveIndicator field='pipelineEnabled' saving={saving} saved={saved} />
            </div>
          </div>

          {/* Interval */}
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-[var(--fg-primary)]'>Run Interval</p>
              <p className='text-xs text-[var(--fg-muted)] mt-0.5'>
                How often the pipeline cycle runs
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <select
                value={settings.pipelineIntervalMinutes}
                onChange={(e) => updateField('pipelineIntervalMinutes', Number(e.target.value))}
                disabled={saving === 'pipelineIntervalMinutes'}
                className={selectClass}
              >
                {INTERVALS.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
              <SaveIndicator field='pipelineIntervalMinutes' saving={saving} saved={saved} />
            </div>
          </div>
        </div>
      </section>

      {/* Logging Section */}
      <section className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]'>
        <div className='p-5 border-b border-[var(--border-subtle)]'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
            Logging
          </h2>
        </div>
        <div className='p-5'>
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-sm font-medium text-[var(--fg-primary)]'>Log Level</p>
              <p className='text-xs text-[var(--fg-muted)] mt-0.5'>
                Minimum severity level stored in job logs
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <SaveIndicator field='logLevel' saving={saving} saved={saved} />
            </div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mt-4'>
            {LOG_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => updateField('logLevel', level.value)}
                disabled={saving === 'logLevel'}
                className={[
                  'rounded-[var(--radius-sm)] border p-3 text-left transition-all',
                  settings.logLevel === level.value
                    ? 'border-[var(--accent-purple)] bg-[var(--accent-purple)]/10'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] hover:border-[var(--fg-muted)]',
                ].join(' ')}
              >
                <p className={`text-sm font-medium ${settings.logLevel === level.value ? 'text-[var(--accent-purple-light)]' : 'text-[var(--fg-primary)]'}`}>
                  {level.label}
                </p>
                <p className='text-xs text-[var(--fg-muted)] mt-1'>{level.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Discovery Filters Section */}
      <section className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]'>
        <div className='p-5 border-b border-[var(--border-subtle)]'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
            Discovery Filters
          </h2>
        </div>
        <div className='p-5 space-y-5'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
            {/* Min Trend Score */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <label className='text-sm font-medium text-[var(--fg-primary)]'>Min Trend Score</label>
                <SaveIndicator field='minTrendScore' saving={saving} saved={saved} />
              </div>
              <p className='text-xs text-[var(--fg-muted)] mb-2'>Minimum score to consider a product trending</p>
              <input
                type='number'
                value={settings.minTrendScore}
                onChange={(e) => updateField('minTrendScore', Number(e.target.value))}
                disabled={saving === 'minTrendScore'}
                min={0}
                max={100}
                step={1}
                className={inputClass}
              />
            </div>

            {/* Min Rating */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <label className='text-sm font-medium text-[var(--fg-primary)]'>Min Rating</label>
                <SaveIndicator field='minRating' saving={saving} saved={saved} />
              </div>
              <p className='text-xs text-[var(--fg-muted)] mb-2'>Minimum product rating (1-5)</p>
              <input
                type='number'
                value={settings.minRating}
                onChange={(e) => updateField('minRating', Number(e.target.value))}
                disabled={saving === 'minRating'}
                min={1}
                max={5}
                step={0.1}
                className={inputClass}
              />
            </div>

            {/* Max Price */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <label className='text-sm font-medium text-[var(--fg-primary)]'>Max Price ($)</label>
                <SaveIndicator field='maxPrice' saving={saving} saved={saved} />
              </div>
              <p className='text-xs text-[var(--fg-muted)] mb-2'>Maximum product price to include</p>
              <input
                type='number'
                value={settings.maxPrice}
                onChange={(e) => updateField('maxPrice', Number(e.target.value))}
                disabled={saving === 'maxPrice'}
                min={0}
                step={10}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Approval Prompt Section */}
      <section className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]'>
        <div className='p-5 border-b border-[var(--border-subtle)]'>
          <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
            AI Approval
          </h2>
        </div>
        <div className='p-5'>
          <div className='flex items-center justify-between mb-1'>
            <label className='text-sm font-medium text-[var(--fg-primary)]'>Default Approval Prompt</label>
            <SaveIndicator field='defaultApprovalPrompt' saving={saving} saved={saved} />
          </div>
          <p className='text-xs text-[var(--fg-muted)] mb-3'>
            System prompt used by AI to evaluate products. Per-category prompts override this.
          </p>
          <textarea
            value={settings.defaultApprovalPrompt || ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, defaultApprovalPrompt: e.target.value }))}
            onBlur={() => updateField('defaultApprovalPrompt', settings.defaultApprovalPrompt)}
            rows={6}
            className={`${inputClass} resize-y font-mono text-xs`}
            placeholder='Enter the default AI approval prompt...'
          />
        </div>
      </section>
    </div>
  );
}

function SaveIndicator({ field, saving, saved }: { field: string; saving: string | null; saved: string | null }) {
  if (saving === field) {
    return <span className='text-xs text-[var(--fg-muted)]'>Saving...</span>;
  }
  if (saved === field) {
    return <span className='text-xs text-green-400'>Saved</span>;
  }
  return null;
}
