'use client';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import EmailTemplates from './EmailTemplates';

export default function TemplatesClientWrapper() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary={true}>
      <EmailTemplates />
    </ProtectedRoute>
  );
}
