'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import UmpiresManagementPage from './UmpiresManagementPage';

export default function UmpiresManagementClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <UmpiresManagementPage />
    </ProtectedRoute>
  );
}
