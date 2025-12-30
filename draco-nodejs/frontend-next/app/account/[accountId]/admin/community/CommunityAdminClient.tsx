'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import CommunityAdminPage from './CommunityAdminPage';

export default function CommunityAdminClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <CommunityAdminPage />
    </ProtectedRoute>
  );
}
