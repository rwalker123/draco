import os from 'os';
import type { NextConfig } from 'next';

const localIPv4s = Object.values(os.networkInterfaces())
  .flatMap((networks) => networks ?? [])
  .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
  .map((iface) => iface.address);

const envAllowedOrigins = (process.env.DEV_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedDevOrigins = Array.from(
  new Set(['localhost', '127.0.0.1', ...localIPv4s, ...envAllowedOrigins]),
);

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  allowedDevOrigins,
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
      // R2 public bucket (production)
      ...(process.env.NEXT_PUBLIC_R2_DOMAIN
        ? [
            {
              protocol: 'https' as const,
              hostname: process.env.NEXT_PUBLIC_R2_DOMAIN,
              pathname: '/**',
            },
          ]
        : []),
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
