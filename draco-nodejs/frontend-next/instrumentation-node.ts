export {};

const globalWithGc = globalThis as typeof globalThis & { gc?: () => void };
const runGc = typeof globalWithGc.gc === 'function' ? globalWithGc.gc.bind(globalWithGc) : null;

const parsed = Number(process.env.GC_INTERVAL_MS);
const intervalMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 5 * 60 * 1000;

const toMb = (bytes: number) => Math.round(bytes / 1024 / 1024);

const logMemory = (phase: string) => {
  const usage = process.memoryUsage();
  console.log(
    `[mem] phase=${phase} rss=${toMb(usage.rss)}MB heapUsed=${toMb(usage.heapUsed)}MB ` +
      `heapTotal=${toMb(usage.heapTotal)}MB external=${toMb(usage.external)}MB ` +
      `arrayBuffers=${toMb(usage.arrayBuffers)}MB`,
  );
};

const timer = setInterval(() => {
  if (runGc) {
    logMemory('pre-gc');
    runGc();
    logMemory('post-gc');
  } else {
    logMemory('sample');
  }
}, intervalMs);
timer.unref();
