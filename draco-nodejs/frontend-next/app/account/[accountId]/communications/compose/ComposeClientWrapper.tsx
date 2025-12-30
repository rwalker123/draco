'use client';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import EmailCompose from './EmailCompose';

export default function ComposeClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <EmailCompose />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
