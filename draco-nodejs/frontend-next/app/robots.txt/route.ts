const DISALLOWED_PATHS = [
  '/account-management*',
  '/admin*',
  '/profile*',
  '/account/*/announcements/manage*',
  '/account/*/communications*',
  '/account/*/hall-of-fame/manage*',
  '/account/*/handouts/manage*',
  '/account/*/league-faq/manage*',
  '/account/*/member-businesses/manage*',
  '/account/*/photo-gallery/admin*',
  '/account/*/polls/manage*',
  '/account/*/seasons*',
  '/account/*/settings*',
  '/account/*/sponsors/manage*',
  '/account/*/surveys/manage*',
  '/account/*/users*',
  '/account/*/workouts*',
] as const;

function parseConfiguredOrigin(): string | null {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;
  if (!configuredOrigin) {
    return null;
  }
  try {
    return new URL(configuredOrigin).origin;
  } catch {
    return null;
  }
}

function resolveOrigin(requestUrl: URL): string {
  const configuredOrigin = parseConfiguredOrigin();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const hostname = requestUrl.hostname === '0.0.0.0' ? 'localhost' : requestUrl.hostname;
  const portSegment = requestUrl.port ? `:${requestUrl.port}` : '';
  return `${requestUrl.protocol}//${hostname}${portSegment}`;
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const origin = resolveOrigin(requestUrl);

  const lines = [
    'User-agent: *',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    `Sitemap: ${new URL('/sitemap.xml', origin).toString()}`,
  ];

  const body = `${lines.join('\n')}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
