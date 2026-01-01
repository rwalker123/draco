'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import CommunityAdminPage from './CommunityAdminPage';

export default function CommunityAdminClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <CommunityAdminPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
