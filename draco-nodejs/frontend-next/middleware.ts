import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only run domain-based routing on root
  const { pathname } = request.nextUrl;
  if (pathname !== '/' && pathname !== '') {
    return NextResponse.next();
  }

  let host = request.headers.get('host');
  if (!host) {
    return NextResponse.next();
  }

  // Strip port if present (e.g., www.example.com:3000 -> www.example.com)
  host = host.replace(/:\d+$/, '');

  // Use backend URL from env or default
  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/api/accounts/by-domain`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Host: host,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.account && data.data.account.id) {
        // Redirect to the account home page
        return NextResponse.redirect(new URL(`/account/${data.data.account.id}/home`, request.url));
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
  ],
};
