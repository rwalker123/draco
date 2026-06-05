export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const globalWithGc = globalThis as typeof globalThis & { gc?: () => void };
  if (typeof globalWithGc.gc !== 'function') return;

  const parsed = Number(process.env.GC_INTERVAL_MS);
  const intervalMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 5 * 60 * 1000;
  const timer = setInterval(() => {
    globalWithGc.gc?.();
  }, intervalMs);
  timer.unref();
}
