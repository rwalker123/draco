'use client';

import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import TeamYouTubeManagementPage from './TeamYouTubeManagementPage';

export default function TeamYouTubeManagementClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
      <TeamYouTubeManagementPage />
    </ProtectedRoute>
  );
}
