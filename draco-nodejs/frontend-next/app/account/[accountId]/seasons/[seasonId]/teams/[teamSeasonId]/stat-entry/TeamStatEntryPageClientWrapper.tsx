'use client';

import { useParams } from 'next/navigation';
import TeamStatEntryPage from './TeamStatEntryPage';

export default function TeamStatEntryPageClientWrapper() {
  const params = useParams();

  const accountId = Array.isArray(params.accountId)
    ? params.accountId[0]
    : (params.accountId ?? '');
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : (params.seasonId ?? '');
  const teamSeasonId = Array.isArray(params.teamSeasonId)
    ? params.teamSeasonId[0]
    : (params.teamSeasonId ?? '');

  return (
    <TeamStatEntryPage accountId={accountId} seasonId={seasonId} teamSeasonId={teamSeasonId} />
  );
}
