'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TeamInformationMessagesManagementPage from './TeamInformationMessagesManagementPage';

export default function TeamInformationMessagesManagementClient() {
  return (
    <ProtectedRoute
      requiredRole={['AccountAdmin', 'LeagueAdmin', 'TeamAdmin']}
      checkAccountBoundary
    >
      <TeamInformationMessagesManagementPage />
    </ProtectedRoute>
  );
}
