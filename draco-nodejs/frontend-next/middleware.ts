import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const normalizeOrigin = (origin: string | null): string | null => {
  if (!origin) {
    return null;
  }
  return origin.replace(/\/+$/, '');
};

export async function middleware(request: NextRequest) {
  // Handle compression headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Clone the request headers and add Accept-Encoding
    const requestHeaders = new Headers(request.headers);

    // Add compression headers if not already present
    if (!requestHeaders.get('Accept-Encoding')) {
      requestHeaders.set('Accept-Encoding', 'gzip, deflate, br');
    }

    const origin = normalizeOrigin(request.nextUrl.origin);
    if (origin && !requestHeaders.get('x-frontend-base-url')) {
      requestHeaders.set('x-frontend-base-url', origin);
    }

    // Return the request with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Only run domain-based routing on root
  const { pathname } = request.nextUrl;
  if (pathname !== '/' && pathname !== '') {
    return NextResponse.next();
  }

  const host = request.headers.get('host');
  if (!host) {
    return NextResponse.next();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.next();
  }

  // Resolve the account by domain directly against the backend
  try {
    // NOTE: Middleware executes before Next.js rewrites, so we hit the backend directly via fetch.
    // Using the generated API client here would try to call a relative path and never reach the backend.
    const response = await fetch(`${apiUrl}/api/accounts/by-domain`, {
      headers: {
        'x-forwarded-host': host,
      },
    });

    if (response.ok) {
      const accountData = await response.json();

      if (typeof accountData?.id === 'string') {
        return NextResponse.redirect(new URL(`/account/${accountData.id}/home`, request.url));
      }
    }
  } catch {
    // Fail silently and continue
  }
  // If not found or error, continue as normal
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/', // Only run on the root path
    '/api/:path*', // Also apply to API routes for compression headers
  ],
};
