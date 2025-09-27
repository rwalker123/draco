'use client';

import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AccountManagement from './AccountManagement';

export default function AccountManagementClientWrapper() {
  return (
    <ProtectedRoute requiredRole="Administrator" checkAccountBoundary={false}>
      <AccountManagement />
    </ProtectedRoute>
  );
}
