'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AccountTypeGuard from '@/components/auth/AccountTypeGuard';
import TeamInformationMessagesManagementPage from './TeamInformationMessagesManagementPage';

export default function TeamInformationMessagesManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute
        requiredRole={['AccountAdmin', 'LeagueAdmin', 'TeamAdmin']}
        checkAccountBoundary
      >
        <TeamInformationMessagesManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
