'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../../context/AuthContext';
import LeagueSeasonManagement from './LeagueSeasonManagement';

export default function LeagueSeasonManagementClientWrapper() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : params.seasonId;

  // Ensure both are strings
  const accountIdStr = accountId ?? '';
  const seasonIdStr = seasonId ?? '';

  // Create season object from the seasonId
  const season = {
    id: seasonIdStr,
    name: 'Season', // This will be updated when we fetch the season data
    accountId: accountIdStr,
  };

  const handleClose = () => {
    router.push(`/account/${accountIdStr}/seasons`);
  };

  return (
    <LeagueSeasonManagement
      accountId={accountIdStr}
      season={season}
      token={token || ''}
      onClose={handleClose}
    />
  );
}
