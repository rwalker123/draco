'use client';

import ProtectedRoute from '../../../../../../../../components/auth/ProtectedRoute';
import TeamVideosPage from './TeamVideosPage';

export default function TeamVideosClientWrapper() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
      <TeamVideosPage />
    </ProtectedRoute>
  );
}
