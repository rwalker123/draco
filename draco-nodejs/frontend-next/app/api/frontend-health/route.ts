const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60;
const WINDOW_MS = 60000;

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  record.count++;
  return record.count > RATE_LIMIT;
}

export async function GET(request: Request) {
  const ip = getClientIP(request);

  if (isRateLimited(ip)) {
    return new Response('Too Many Requests', { status: 429 });
  }

  const mem = process.memoryUsage();
  return Response.json({
    status: 'ok',
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
}
