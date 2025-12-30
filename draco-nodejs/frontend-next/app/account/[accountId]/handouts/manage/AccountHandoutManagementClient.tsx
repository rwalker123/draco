'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import AccountHandoutManagementPage from './AccountHandoutManagementPage';

export default function AccountHandoutManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
        <AccountHandoutManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
