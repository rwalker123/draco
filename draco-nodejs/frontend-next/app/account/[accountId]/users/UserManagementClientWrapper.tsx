'use client';

import { useParams } from 'next/navigation';
import UserManagement from './UserManagement';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';

export default function UserManagementClientWrapper() {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  if (!accountIdStr) {
    return <div>Account ID not found</div>;
  }

  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <UserManagement accountId={accountIdStr} />
    </ProtectedRoute>
  );
}
