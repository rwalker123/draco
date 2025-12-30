'use client';

import ProtectedRoute from '../../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../../components/auth/AccountTypeGuard';
import EditTemplate from './EditTemplate';

export default function EditTemplateClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary={true}>
        <EditTemplate />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
