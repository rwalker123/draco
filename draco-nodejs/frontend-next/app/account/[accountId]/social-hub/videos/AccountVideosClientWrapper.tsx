'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountVideosPage from './AccountVideosPage';

export default function AccountVideosClientWrapper() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
      <AccountVideosPage />
    </ProtectedRoute>
  );
}
