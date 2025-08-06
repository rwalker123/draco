'use client';
import LeagueSeasonManagementClientWrapper from './LeagueSeasonManagementClientWrapper';
import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <LeagueSeasonManagementClientWrapper />
    </ProtectedRoute>
  );
}
