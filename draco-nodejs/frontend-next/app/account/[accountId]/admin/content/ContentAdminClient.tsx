'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import ContentAdminPage from './ContentAdminPage';

export default function ContentAdminClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <ContentAdminPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
