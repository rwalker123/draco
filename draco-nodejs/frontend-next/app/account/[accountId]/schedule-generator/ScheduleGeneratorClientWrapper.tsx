'use client';
import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../components/auth/AccountTypeGuard';
import ScheduleGenerator from './ScheduleGenerator';

export default function ScheduleGeneratorClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId)
    ? params.accountId[0]
    : (params.accountId ?? '');

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
        <ScheduleGenerator accountId={accountId} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
