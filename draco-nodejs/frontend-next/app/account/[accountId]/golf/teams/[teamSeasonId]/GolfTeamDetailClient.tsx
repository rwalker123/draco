'use client';

import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';
import GolfTeamDetailPage from './GolfTeamDetailPage';

export default function GolfTeamDetailClient() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
      <GolfTeamDetailPage />
    </ProtectedRoute>
  );
}
