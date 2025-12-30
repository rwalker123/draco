'use client';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';
import Communications from './Communications';

export default function CommunicationsClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <Communications />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
