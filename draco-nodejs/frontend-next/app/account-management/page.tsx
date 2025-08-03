'use client';
import AccountManagement from './AccountManagement';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requiredRole="Administrator" checkAccountBoundary={false}>
      <AccountManagement />
    </ProtectedRoute>
  );
}
