'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import SeasonAdminPage from './SeasonAdminPage';

export default function SeasonAdminClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <SeasonAdminPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
