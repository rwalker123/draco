'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import InformationMessagesManagementPage from './InformationMessagesManagementPage';

export default function InformationMessagesManagementClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      <InformationMessagesManagementPage />
    </ProtectedRoute>
  );
}
