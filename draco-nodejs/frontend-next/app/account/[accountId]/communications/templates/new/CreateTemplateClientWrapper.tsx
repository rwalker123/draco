'use client';

import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../components/auth/AccountTypeGuard';
import TemplateForm from './TemplateForm';

export default function CreateTemplateClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary={true}>
        <TemplateForm mode="create" />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
