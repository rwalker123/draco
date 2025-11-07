'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountAnnouncementsManagementPage from './AccountAnnouncementsManagementPage';

export default function AccountAnnouncementsManagementClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary={true}>
      <AccountAnnouncementsManagementPage />
    </ProtectedRoute>
  );
}
