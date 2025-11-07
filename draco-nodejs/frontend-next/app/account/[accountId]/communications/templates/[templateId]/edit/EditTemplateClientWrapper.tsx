'use client';

import ProtectedRoute from '../../../../../../../components/auth/ProtectedRoute';
import EditTemplate from './EditTemplate';

export default function EditTemplateClientWrapper() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary={true}>
      <EditTemplate />
    </ProtectedRoute>
  );
}
