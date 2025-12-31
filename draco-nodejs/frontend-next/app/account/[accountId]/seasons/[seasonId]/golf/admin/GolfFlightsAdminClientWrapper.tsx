'use client';

import { useParams } from 'next/navigation';
import AccountTypeGuard from '../../../../../../../components/auth/AccountTypeGuard';
import ProtectedRoute from '../../../../../../../components/auth/ProtectedRoute';
import GolfFlightsAdminPage from './GolfFlightsAdminPage';

export default function GolfFlightsAdminClientWrapper() {
  const params = useParams();

  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : params.seasonId;

  const accountIdStr = accountId ?? '';
  const seasonIdStr = seasonId ?? '';

  return (
    <AccountTypeGuard requiredAccountType="golf">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
        <GolfFlightsAdminPage accountId={accountIdStr} seasonId={seasonIdStr} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
