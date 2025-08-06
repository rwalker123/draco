'use client';
import AccountSettings from './AccountSettings';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <AccountSettings />
    </ProtectedRoute>
  );
}
