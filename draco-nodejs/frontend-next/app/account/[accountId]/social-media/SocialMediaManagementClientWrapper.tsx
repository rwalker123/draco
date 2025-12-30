'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AccountTypeGuard from '@/components/auth/AccountTypeGuard';
import SocialMediaManagement from './SocialMediaManagement';

export default function SocialMediaManagementClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <SocialMediaManagement />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
