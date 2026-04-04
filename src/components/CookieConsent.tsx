'use client';

import { useState } from 'react';
import { useConsent } from '@/providers/ConsentProvider';
import { DEFAULT_PREFERENCES } from '@/lib/consent';

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer'
      } ${checked ? 'bg-[var(--accent-purple)]' : 'bg-[var(--bg-tertiary)]'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

const CATEGORIES = [
  {
    key: 'essential' as const,
    label: 'Essential',
    description: 'Required for the site to function. Always active.',
    locked: true,
  },
  {
    key: 'analytics' as const,
    label: 'Analytics',
    description:
      'Helps us understand site usage and improve the experience. Always active.',
    locked: true,
  },
  {
    key: 'marketing' as const,
    label: 'Marketing',
    description:
      'Used to deliver relevant ads and track campaign performance.',
    locked: false,
  },
  {
    key: 'adStorage' as const,
    label: 'Ad Storage',
    description:
      'Enables storage, such as cookies, related to advertising.',
    locked: false,
  },
  {
    key: 'adUserData' as const,
    label: 'Ad User Data',
    description:
      'Sets consent for sending user data to Google for online advertising purposes.',
    locked: false,
  },
  {
    key: 'adPersonalization' as const,
    label: 'Ad Personalization',
    description:
      'Sets consent for personalized advertising.',
    locked: false,
  },
];

export default function CookieConsent() {
  const { hasConsented, ready, acceptAll, saveCustom } = useConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(DEFAULT_PREFERENCES.analytics);
  const [marketing, setMarketing] = useState(DEFAULT_PREFERENCES.marketing);
  const [adStorage, setAdStorage] = useState(DEFAULT_PREFERENCES.adStorage);
  const [adUserData, setAdUserData] = useState(DEFAULT_PREFERENCES.adUserData);
  const [adPersonalization, setAdPersonalization] = useState(DEFAULT_PREFERENCES.adPersonalization);

  // Don't render until client has checked the cookie — prevents flash
  if (!ready || hasConsented) return null;

  const handleSave = () => {
    saveCustom({ analytics, marketing, adStorage, adUserData, adPersonalization });
  };

  return (
    <div className='fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6'>
      <div className='mx-auto max-w-2xl glass-heavy rounded-[var(--radius-lg)] shadow-2xl shadow-black/50'>
        <div className='h-px bg-gradient-to-r from-transparent via-[var(--accent-purple)] to-transparent' />

        <div className='p-6'>
          {!showSettings ? (
            <>
              <p className='text-sm text-[var(--fg-secondary)] mb-5'>
                We use cookies to improve your experience and analyse site
                traffic. You can adjust your preferences or accept all cookies.
              </p>
              <div className='flex flex-col sm:flex-row gap-3'>
                <button
                  onClick={acceptAll}
                  className='flex-1 px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold text-white bg-[var(--accent-purple)] hover:opacity-90 transition-opacity'
                >
                  Accept All
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className='flex-1 px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--fg-secondary)] border border-[var(--border-subtle)] hover:text-[var(--fg-primary)] hover:border-[var(--fg-muted)] transition-colors'
                >
                  Adjust
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className='text-base font-semibold text-[var(--fg-primary)] mb-4'>
                Cookie Preferences
              </h3>
              <div className='space-y-4 mb-6'>
                {CATEGORIES.map((cat) => {
                  const checked =
                    cat.key === 'essential'
                      ? true
                      : cat.key === 'analytics'
                        ? analytics
                        : cat.key === 'marketing'
                          ? marketing
                          : cat.key === 'adStorage'
                            ? adStorage
                            : cat.key === 'adUserData'
                              ? adUserData
                              : adPersonalization;

                  const onChange =
                    cat.key === 'analytics' ? setAnalytics : 
                    cat.key === 'marketing' ? setMarketing :
                    cat.key === 'adStorage' ? setAdStorage :
                    cat.key === 'adUserData' ? setAdUserData :
                    cat.key === 'adPersonalization' ? setAdPersonalization : setAnalytics;

                  return (
                    <div
                      key={cat.key}
                      className='flex items-start justify-between gap-4'
                    >
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-[var(--fg-primary)]'>
                          {cat.label}
                        </p>
                        <p className='text-xs text-[var(--fg-muted)] mt-0.5'>
                          {cat.description}
                        </p>
                      </div>
                      <Toggle
                        checked={checked}
                        disabled={cat.locked}
                        onChange={onChange}
                      />
                    </div>
                  );
                })}
              </div>
              <div className='flex flex-col sm:flex-row gap-3'>
                <button
                  onClick={handleSave}
                  className='flex-1 px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold text-white bg-[var(--accent-purple)] hover:opacity-90 transition-opacity'
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className='flex-1 px-5 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--fg-secondary)] border border-[var(--border-subtle)] hover:text-[var(--fg-primary)] hover:border-[var(--fg-muted)] transition-colors'
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
