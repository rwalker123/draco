'use client';

import SeasonManagement from './SeasonManagement';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';

export default function SeasonManagementClientWrapper() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <SeasonManagement />
    </ProtectedRoute>
  );
}
