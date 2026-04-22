'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TeamEmailHistoryPage from './TeamEmailHistoryPage';

export default function TeamEmailHistoryClient() {
  return (
    <ProtectedRoute
      requiredRole={['Administrator', 'AccountAdmin', 'TeamAdmin']}
      checkAccountBoundary
    >
      <TeamEmailHistoryPage />
    </ProtectedRoute>
  );
}
