'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import AccountAdminPage from './AccountAdminPage';

export default function AccountAdminClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <AccountAdminPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
