import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3001';
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
    domains: ['localhost', 'draco-account-resources-dev.s3.us-east-1.amazonaws.com'],
  },
};

export default nextConfig;
