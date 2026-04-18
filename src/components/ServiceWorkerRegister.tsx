'use client';

import { useEffect } from 'react';

/**
 * Registers the app shell service worker so browsers can treat the site as installable (PWA).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }
    void navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }, []);

  return null;
}
