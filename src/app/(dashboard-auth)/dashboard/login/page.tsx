'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const from = searchParams.get('from') || '/dashboard/overview';
        router.push(from);
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Network error, try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4'>
      <div className='w-full max-w-sm'>
        {/* Logo */}
        <div className='flex justify-center mb-8'>
          <Image src='/logo.png' alt='Seenlio' width={140} height={42} className='h-10 w-auto' />
        </div>

        {/* Card */}
        <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8'>
          <h1 className='text-lg font-semibold text-[var(--fg-primary)] mb-1'>Analytics</h1>
          <p className='text-sm text-[var(--fg-muted)] mb-6'>Enter your password to access the dashboard</p>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Password'
                autoFocus
                className='w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--fg-primary)] placeholder:text-[var(--fg-faint)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors text-sm'
              />
            </div>

            {error && (
              <p className='text-xs text-[var(--accent-pink)]'>{error}</p>
            )}

            <button
              type='submit'
              disabled={loading || !password}
              className='w-full py-3 bg-[var(--accent-purple)] hover:bg-[var(--accent-purple-dark)] disabled:opacity-50 text-white font-medium rounded-[var(--radius-sm)] transition-colors text-sm'
            >
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
