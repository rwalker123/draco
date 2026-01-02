'use client';
import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import ScheduleManagement from './ScheduleManagement';

export default function ScheduleManagementClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId)
    ? params.accountId[0]
    : (params.accountId ?? '');

  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <ScheduleManagement accountId={accountId} />
    </ProtectedRoute>
  );
}
