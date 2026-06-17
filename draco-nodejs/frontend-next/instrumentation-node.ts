export {};

const parsed = Number(process.env.MEM_SAMPLE_INTERVAL_MS);
const intervalMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 5 * 60 * 1000;

const toMb = (bytes: number) => Math.round(bytes / 1024 / 1024);

const logMemory = () => {
  const usage = process.memoryUsage();
  console.log(
    `[mem] phase=sample rss=${toMb(usage.rss)}MB heapUsed=${toMb(usage.heapUsed)}MB ` +
      `heapTotal=${toMb(usage.heapTotal)}MB external=${toMb(usage.external)}MB ` +
      `arrayBuffers=${toMb(usage.arrayBuffers)}MB`,
  );
};

const timer = setInterval(logMemory, intervalMs);
timer.unref();
