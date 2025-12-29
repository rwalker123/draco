'use client';

import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import AdminHubPage from './AdminHubPage';

export default function AdminHubClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <AdminHubPage />
    </ProtectedRoute>
  );
}
