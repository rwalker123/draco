'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import FieldsManagementPage from './FieldsManagementPage';

export default function FieldsManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <FieldsManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
