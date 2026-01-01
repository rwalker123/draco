'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import HallOfFameManagementPage from './HallOfFameManagementPage';

export default function HallOfFameManagementClient() {
  const params = useParams();
  const paramValue = params?.accountId;
  const accountId = Array.isArray(paramValue) ? paramValue[0] : (paramValue as string | undefined);

  if (!accountId) {
    return <div>Account ID is required.</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
        <HallOfFameManagementPage accountId={accountId} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
