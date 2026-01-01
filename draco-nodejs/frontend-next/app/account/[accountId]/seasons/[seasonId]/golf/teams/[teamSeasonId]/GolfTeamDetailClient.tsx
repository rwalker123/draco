'use client';

import ProtectedRoute from '../../../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../../../components/auth/AccountTypeGuard';
import GolfTeamDetailPage from './GolfTeamDetailPage';

export default function GolfTeamDetailClient() {
  return (
    <AccountTypeGuard requiredAccountType="golf">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
        <GolfTeamDetailPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
