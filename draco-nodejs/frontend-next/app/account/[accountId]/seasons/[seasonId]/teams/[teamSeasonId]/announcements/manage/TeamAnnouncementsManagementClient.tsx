'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AccountTypeGuard from '@/components/auth/AccountTypeGuard';
import TeamAnnouncementsManagementPage from './TeamAnnouncementsManagementPage';

export default function TeamAnnouncementsManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
        <TeamAnnouncementsManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
