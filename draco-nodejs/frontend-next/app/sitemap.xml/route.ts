import type { MetadataRoute } from 'next';

import { buildCanonicalUrl } from '../../lib/seoMetadata';

const STATIC_ROUTES = ['/', '/accounts', '/signup'] as const;

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

const CHANGE_FREQUENCIES: Record<(typeof STATIC_ROUTES)[number], ChangeFrequency> = {
  '/': 'daily',
  '/accounts': 'weekly',
  '/signup': 'monthly',
};

const PRIORITIES: Record<(typeof STATIC_ROUTES)[number], number> = {
  '/': 1,
  '/accounts': 0.8,
  '/signup': 0.6,
};

export const revalidate = 0; // Avoid caching host-specific output in the Next.js cache
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);

  // Only allow sitemap responses from the primary configured host
  const tenantHost = requestUrl.hostname !== 'localhost' && requestUrl.hostname !== '127.0.0.1';
  const configuredHost =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;
  const isPrimaryHost =
    configuredHost &&
    new URL(configuredHost).hostname.replace(/^www\./, '') ===
      requestUrl.hostname.replace(/^www\./, '');

  if (tenantHost && !isPrimaryHost) {
    return new Response('Not Found', { status: 404 });
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  let requestOrigin = configuredOrigin?.replace(/\/$/, '') ?? requestUrl.origin;

  if (!configuredOrigin) {
    const hostname = requestUrl.hostname === '0.0.0.0' ? 'localhost' : requestUrl.hostname;
    const portSegment = requestUrl.port ? `:${requestUrl.port}` : '';
    requestOrigin = `${requestUrl.protocol}//${hostname}${portSegment}`;
  }
  const shouldCache = Boolean(configuredOrigin);
  const lastModified = new Date().toISOString();

  const urlEntries = STATIC_ROUTES.map((path) => {
    const url = buildCanonicalUrl(path, { origin: requestOrigin });
    const changeFrequency = CHANGE_FREQUENCIES[path];
    const priority = PRIORITIES[path];
    return [
      '  <url>',
      `    <loc>${url}</loc>`,
      `    <lastmod>${lastModified}</lastmod>`,
      `    <changefreq>${changeFrequency}</changefreq>`,
      `    <priority>${priority.toFixed(1)}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
  ].join('\n');

  const headers = new Headers({
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': shouldCache ? 'public, max-age=3600' : 'no-store',
  });

  return new Response(xml, { headers });
}
