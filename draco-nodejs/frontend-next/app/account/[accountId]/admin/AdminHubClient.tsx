'use client';

import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';
import AdminHubPage from './AdminHubPage';

export default function AdminHubClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <AdminHubPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
