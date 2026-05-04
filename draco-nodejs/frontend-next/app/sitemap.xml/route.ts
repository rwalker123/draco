import type { MetadataRoute } from 'next';

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

function parseConfiguredOrigin(configuredOrigin: string | undefined): URL | null {
  if (!configuredOrigin) {
    return null;
  }
  try {
    return new URL(configuredOrigin);
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const configuredOriginUrl = parseConfiguredOrigin(configuredOrigin);
  const requestHost = requestUrl.hostname.replace(/^www\./, '');
  const configuredHost = configuredOriginUrl?.hostname.replace(/^www\./, '') ?? null;

  const shouldEnforcePrimaryHost =
    process.env.NODE_ENV === 'production' && configuredHost !== null && configuredHost.length > 0;

  if (shouldEnforcePrimaryHost && configuredHost !== requestHost) {
    return new Response('Not Found', { status: 404 });
  }

  let requestOrigin: string;

  if (configuredOriginUrl) {
    requestOrigin = configuredOriginUrl.origin;
  } else {
    const hostname = requestUrl.hostname === '0.0.0.0' ? 'localhost' : requestUrl.hostname;
    const portSegment = requestUrl.port ? `:${requestUrl.port}` : '';
    requestOrigin = `${requestUrl.protocol}//${hostname}${portSegment}`;
  }
  const shouldCache = configuredOriginUrl !== null;
  const lastModified = new Date().toISOString();

  const urlEntries = STATIC_ROUTES.map((path) => {
    const url = new URL(path, requestOrigin).toString();
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
