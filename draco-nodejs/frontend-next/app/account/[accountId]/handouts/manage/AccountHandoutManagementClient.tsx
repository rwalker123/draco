'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountHandoutManagementPage from './AccountHandoutManagementPage';

export default function AccountHandoutManagementClient() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
      <AccountHandoutManagementPage />
    </ProtectedRoute>
  );
}
