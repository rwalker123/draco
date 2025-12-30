'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import { LeagueFaqManagement } from '../../../../../components/league-faq/LeagueFaqManagement';

export default function LeagueFaqClientWrapper() {
  const params = useParams();
  const accountIdParam = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const accountId = accountIdParam ?? '';

  if (!accountId) {
    return <div>Account ID not found</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredPermission="league.faq.manage" checkAccountBoundary={true}>
        <LeagueFaqManagement accountId={accountId} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
