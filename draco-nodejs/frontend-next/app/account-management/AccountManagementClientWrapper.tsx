'use client';

import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AccountManagement from './AccountManagement';

export default function AccountManagementClientWrapper() {
  return (
    <ProtectedRoute checkAccountBoundary={false}>
      <AccountManagement />
    </ProtectedRoute>
  );
}
