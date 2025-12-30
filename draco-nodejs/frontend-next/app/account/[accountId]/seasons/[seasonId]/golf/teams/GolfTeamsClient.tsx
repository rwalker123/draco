'use client';

import ProtectedRoute from '../../../../../../../components/auth/ProtectedRoute';
import GolfTeamsPage from './GolfTeamsPage';

export default function GolfTeamsClient() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
      <GolfTeamsPage />
    </ProtectedRoute>
  );
}
