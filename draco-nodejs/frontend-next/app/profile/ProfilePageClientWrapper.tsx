'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProfilePageClient from './ProfilePageClient';

export default function ProfilePageClientWrapper() {
  return (
    <ProtectedRoute checkAccountBoundary={false}>
      <ProfilePageClient />
    </ProtectedRoute>
  );
}
