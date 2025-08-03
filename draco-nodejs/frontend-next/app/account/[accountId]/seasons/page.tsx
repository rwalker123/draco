'use client';
import SeasonManagement from './SeasonManagement';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'ContactAdmin']} checkAccountBoundary={true}>
      <SeasonManagement />
    </ProtectedRoute>
  );
}
