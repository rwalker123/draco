'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import InformationMessagesManagementPage from './InformationMessagesManagementPage';

export default function InformationMessagesManagementClient() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <InformationMessagesManagementPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
