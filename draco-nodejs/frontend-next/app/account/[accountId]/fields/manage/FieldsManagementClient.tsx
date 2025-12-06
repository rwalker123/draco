'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import FieldsManagementPage from './FieldsManagementPage';

export default function FieldsManagementClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <FieldsManagementPage />
    </ProtectedRoute>
  );
}
