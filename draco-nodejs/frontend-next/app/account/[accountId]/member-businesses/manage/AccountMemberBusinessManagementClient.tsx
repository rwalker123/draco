'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AccountTypeGuard from '@/components/auth/AccountTypeGuard';
import AccountMemberBusinessManagement from './AccountMemberBusinessManagement';

export default function AccountMemberBusinessManagementClient() {
  const params = useParams();
  const accountId = Array.isArray(params?.accountId) ? params.accountId[0] : params?.accountId;

  if (!accountId) {
    return <div>Account ID not found</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredPermission="account.contacts.manage" checkAccountBoundary>
        <AccountMemberBusinessManagement accountId={accountId} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
