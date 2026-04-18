/* Minimal service worker so the app meets installability criteria (fetch handler). */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  /* Intentionally empty: requests use the default network path. */
});
