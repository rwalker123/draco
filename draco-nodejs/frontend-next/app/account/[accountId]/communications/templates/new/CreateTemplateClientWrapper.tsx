'use client';

import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';
import TemplateForm from './TemplateForm';

export default function CreateTemplateClientWrapper() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary={true}>
      <TemplateForm mode="create" />
    </ProtectedRoute>
  );
}
