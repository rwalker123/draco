import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://localhost:3001/api/:path*', // Proxy to backend
      },
      {
        source: '/uploads/:path*',
        destination: 'https://localhost:3001/uploads/:path*', // Proxy to backend
      },
    ];
  },
  images: {
    domains: ['localhost', 'draco-account-resources-dev.s3.us-east-1.amazonaws.com'],
  },
};

export default nextConfig;
