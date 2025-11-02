'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import SurveyManagementPage from './SurveyManagementPage';

export default function SurveyManagementClientWrapper() {
  const params = useParams();
  const accountParam = params?.accountId;
  const accountId = Array.isArray(accountParam)
    ? accountParam[0]
    : (accountParam as string | undefined);

  if (!accountId) {
    return <div>Account ID is required.</div>;
  }

  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <SurveyManagementPage accountId={accountId} />
    </ProtectedRoute>
  );
}
