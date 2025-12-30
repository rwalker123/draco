'use client';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import EmailTemplates from './EmailTemplates';

export default function TemplatesClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary={true}>
        <EmailTemplates />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
