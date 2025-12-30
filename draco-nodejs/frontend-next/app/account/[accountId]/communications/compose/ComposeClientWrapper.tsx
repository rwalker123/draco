'use client';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import EmailCompose from './EmailCompose';

export default function ComposeClientWrapper() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <EmailCompose />
    </ProtectedRoute>
  );
}
