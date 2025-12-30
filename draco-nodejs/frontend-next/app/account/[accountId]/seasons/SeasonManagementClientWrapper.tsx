'use client';

import SeasonManagement from './SeasonManagement';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';

export default function SeasonManagementClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <SeasonManagement />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
