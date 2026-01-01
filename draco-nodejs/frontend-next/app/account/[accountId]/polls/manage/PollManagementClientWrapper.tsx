'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import PollManagementPage from './PollManagementPage';

export default function PollManagementClientWrapper() {
  const params = useParams();
  const accountParam = params?.accountId;
  const accountId = Array.isArray(accountParam)
    ? accountParam[0]
    : (accountParam as string | undefined);

  if (!accountId) {
    return <div>Account ID is required.</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary={true}>
        <PollManagementPage accountId={accountId} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
