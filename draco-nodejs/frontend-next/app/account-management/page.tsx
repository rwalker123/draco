'use client';

import type { Metadata } from 'next';
import AccountManagement from './AccountManagement';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { DEFAULT_SITE_NAME } from '../../lib/seoMetadata';

export const metadata: Metadata = {
  title: `Account Management | ${DEFAULT_SITE_NAME}`,
  description:
    'Administrative workspace for provisioning organizations, managing billing, and configuring platform-wide settings in Draco Sports Manager.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/account-management',
  },
  openGraph: {
    title: `Account Management | ${DEFAULT_SITE_NAME}`,
    description:
      'Administrative workspace for provisioning organizations, managing billing, and configuring platform-wide settings in Draco Sports Manager.',
    url: '/account-management',
    siteName: DEFAULT_SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Account Management | ${DEFAULT_SITE_NAME}`,
    description:
      'Administrative workspace for provisioning organizations, managing billing, and configuring platform-wide settings in Draco Sports Manager.',
  },
};

export default function Page() {
  return (
    <ProtectedRoute requiredRole="Administrator" checkAccountBoundary={false}>
      <AccountManagement />
    </ProtectedRoute>
  );
}
