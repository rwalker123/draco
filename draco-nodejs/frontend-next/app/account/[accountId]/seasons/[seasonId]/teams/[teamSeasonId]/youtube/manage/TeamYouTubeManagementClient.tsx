'use client';

import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../../../../components/auth/AccountTypeGuard';
import TeamYouTubeManagementPage from './TeamYouTubeManagementPage';

export default function TeamYouTubeManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
        <TeamYouTubeManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
