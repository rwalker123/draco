'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import ContentAdminPage from './ContentAdminPage';

export default function ContentAdminClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <ContentAdminPage />
    </ProtectedRoute>
  );
}
