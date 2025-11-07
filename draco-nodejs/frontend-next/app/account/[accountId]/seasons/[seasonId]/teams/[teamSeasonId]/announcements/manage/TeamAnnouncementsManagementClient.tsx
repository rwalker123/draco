'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TeamAnnouncementsManagementPage from './TeamAnnouncementsManagementPage';

export default function TeamAnnouncementsManagementClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
      <TeamAnnouncementsManagementPage />
    </ProtectedRoute>
  );
}
