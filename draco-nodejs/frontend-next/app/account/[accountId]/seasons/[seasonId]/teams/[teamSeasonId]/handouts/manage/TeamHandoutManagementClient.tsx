'use client';

import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import TeamHandoutManagementPage from './TeamHandoutManagementPage';

export default function TeamHandoutManagementClient() {
  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary>
      <TeamHandoutManagementPage />
    </ProtectedRoute>
  );
}
