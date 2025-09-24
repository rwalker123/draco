'use client';

import type { Metadata } from 'next';
import AdminDashboard from './AdminDashboard';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { DEFAULT_SITE_NAME } from '../../lib/seoMetadata';

export const metadata: Metadata = {
  title: `Administrator Tools | ${DEFAULT_SITE_NAME}`,
  description:
    'Administrative console for managing Draco Sports Manager platform configuration, accounts, and feature flags.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/admin',
  },
  openGraph: {
    title: `Administrator Tools | ${DEFAULT_SITE_NAME}`,
    description:
      'Administrative console for managing Draco Sports Manager platform configuration, accounts, and feature flags.',
    url: '/admin',
    siteName: DEFAULT_SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Administrator Tools | ${DEFAULT_SITE_NAME}`,
    description:
      'Administrative console for managing Draco Sports Manager platform configuration, accounts, and feature flags.',
  },
};

export default function Page() {
  return (
    <ProtectedRoute requiredRole="Administrator" checkAccountBoundary={false}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
