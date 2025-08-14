'use client';

import { useParams } from 'next/navigation';
import { WorkoutSourcesForm } from '../../../../../components/workouts/WorkoutSourcesForm';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';

export default function WorkoutSourcesClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const accountIdStr = accountId ?? '';

  if (!accountIdStr) {
    return <div>Account ID not found</div>;
  }

  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <WorkoutSourcesForm />
    </ProtectedRoute>
  );
}
