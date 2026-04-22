'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TeamEmailComposePage from './TeamEmailComposePage';

export default function TeamEmailComposeClient() {
  return (
    <ProtectedRoute
      requiredRole={['Administrator', 'AccountAdmin', 'TeamAdmin']}
      checkAccountBoundary
    >
      <TeamEmailComposePage />
    </ProtectedRoute>
  );
}
