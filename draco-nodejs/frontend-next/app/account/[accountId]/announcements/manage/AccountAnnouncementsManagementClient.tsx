'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import AccountAnnouncementsManagementPage from './AccountAnnouncementsManagementPage';

export default function AccountAnnouncementsManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary={true}>
        <AccountAnnouncementsManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
