'use client';

import { useParams } from 'next/navigation';
import UserManagement from './UserManagement';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';

export default function UserManagementClientWrapper() {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  if (!accountIdStr) {
    return <div>Account ID not found</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <UserManagement accountId={accountIdStr} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
