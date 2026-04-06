'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem('disable_analytics') === 'true';
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function useAnalyticsDisabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
