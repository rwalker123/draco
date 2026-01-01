'use client';

import { useParams } from 'next/navigation';
import { WorkoutsManagement } from '../../../../components/workouts/WorkoutsManagement';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';

export default function WorkoutsClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const accountIdStr = accountId ?? '';

  if (!accountIdStr) {
    return <div>Account ID not found</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <WorkoutsManagement accountId={accountIdStr} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
