'use client';

import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../../../../components/auth/AccountTypeGuard';
import TeamHandoutManagementPage from './TeamHandoutManagementPage';

export default function TeamHandoutManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
        <TeamHandoutManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
