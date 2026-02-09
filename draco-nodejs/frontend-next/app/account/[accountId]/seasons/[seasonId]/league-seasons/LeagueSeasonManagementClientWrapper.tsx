'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../components/auth/AccountTypeGuard';
import LeagueSeasonManagement from './LeagueSeasonManagement';

export default function LeagueSeasonManagementClientWrapper() {
  const params = useParams();

  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : params.seasonId;

  const accountIdStr = accountId ?? '';
  const seasonIdStr = seasonId ?? '';

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <LeagueSeasonManagement accountId={accountIdStr} seasonId={seasonIdStr} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
