import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3001';
    console.log('🔄 [NEXT_CONFIG] Setting up rewrites with backend URL:', backendUrl);
    console.log('🔄 [NEXT_CONFIG] API rewrite: /api/:path* -> ' + `${backendUrl}/api/:path*`);
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`, // Proxy to backend
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`, // Proxy to backend
      },
    ];
  },
  images: {
    remotePatterns: [
      // Only allow localhost in development (LocalStack)
      ...(process.env.NODE_ENV === 'development'
        ? [
            {
              protocol: 'http' as const,
              hostname: 'localhost',
              port: '4566',
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
