'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import UmpiresManagementPage from './UmpiresManagementPage';

export default function UmpiresManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <UmpiresManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
