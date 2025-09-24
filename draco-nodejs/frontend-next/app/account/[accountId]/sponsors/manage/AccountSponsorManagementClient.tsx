'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountSponsorManagement from './AccountSponsorManagement';

export default function AccountSponsorManagementClient() {
  const params = useParams();
  const accountId = Array.isArray(params?.accountId) ? params?.accountId[0] : params?.accountId;

  if (!accountId) {
    return <div>Account ID not found</div>;
  }

  return (
    <ProtectedRoute requiredPermission="account.sponsors.manage" checkAccountBoundary>
      <AccountSponsorManagement accountId={accountId} />
    </ProtectedRoute>
  );
}
