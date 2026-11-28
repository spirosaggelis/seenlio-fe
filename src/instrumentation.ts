export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const state = globalThis as typeof globalThis & { __seenlioIndexNow?: boolean };
  if (state.__seenlioIndexNow) return;
  state.__seenlioIndexNow = true;

  const { runIndexNowSync } = await import('@/lib/indexnowSync');
  const tick = () => {
    void runIndexNowSync().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'sync failed';
      console.error(`[indexnow] sync failed ${message}`);
    });
  };
  setTimeout(tick, 30_000);
  setInterval(tick, 5 * 60 * 1000);
}
