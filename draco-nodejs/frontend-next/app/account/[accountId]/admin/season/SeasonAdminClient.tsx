'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import SeasonAdminPage from './SeasonAdminPage';

export default function SeasonAdminClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <SeasonAdminPage />
    </ProtectedRoute>
  );
}
