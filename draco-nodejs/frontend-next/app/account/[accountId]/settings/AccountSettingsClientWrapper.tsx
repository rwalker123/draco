'use client';

import AccountSettings from './AccountSettings';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';

export default function AccountSettingsClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <AccountSettings />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
