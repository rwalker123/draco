'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountAdminPage from './AccountAdminPage';

export default function AccountAdminClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <AccountAdminPage />
    </ProtectedRoute>
  );
}
