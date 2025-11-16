'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import MemberBusinessDirectoryPage from './MemberBusinessDirectoryPage';

export default function MemberBusinessDirectoryClientWrapper() {
  return (
    <ProtectedRoute
      requiredRole={['Contact', 'AccountAdmin', 'TeamAdmin', 'ContactAdmin']}
      checkAccountBoundary
    >
      <MemberBusinessDirectoryPage />
    </ProtectedRoute>
  );
}
