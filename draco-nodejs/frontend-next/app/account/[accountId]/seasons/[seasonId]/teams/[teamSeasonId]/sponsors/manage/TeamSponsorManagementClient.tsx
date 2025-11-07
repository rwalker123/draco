'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import TeamSponsorManagement from './TeamSponsorManagement';

export default function TeamSponsorManagementClient() {
  const params = useParams();
  const accountId = Array.isArray(params?.accountId) ? params?.accountId[0] : params?.accountId;
  const seasonId = Array.isArray(params?.seasonId) ? params?.seasonId[0] : params?.seasonId;
  const teamSeasonId = Array.isArray(params?.teamSeasonId)
    ? params?.teamSeasonId[0]
    : params?.teamSeasonId;

  if (!accountId || !seasonId || !teamSeasonId) {
    return <div>Invalid route parameters</div>;
  }

  return (
    <ProtectedRoute requiredRole={['AccountAdmin', 'TeamAdmin']} checkAccountBoundary={true}>
      <TeamSponsorManagement
        accountId={accountId}
        seasonId={seasonId}
        teamSeasonId={teamSeasonId}
      />
    </ProtectedRoute>
  );
}
