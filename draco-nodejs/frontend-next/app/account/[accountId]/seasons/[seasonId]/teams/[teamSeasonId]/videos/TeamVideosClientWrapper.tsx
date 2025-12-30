'use client';

import ProtectedRoute from '../../../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../../../components/auth/AccountTypeGuard';
import TeamVideosPage from './TeamVideosPage';

export default function TeamVideosClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
        <TeamVideosPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
