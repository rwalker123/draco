'use client';

import { useParams, useSearchParams } from 'next/navigation';
import LeaguePlayerProfile from '@/components/golf/player/LeaguePlayerProfile';

export default function LeaguePlayerProfileClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : params.seasonId;
  const contactId = Array.isArray(params.contactId) ? params.contactId[0] : params.contactId;
  const playerName = searchParams.get('name') ?? undefined;

  const accountIdStr = accountId ?? '';
  const seasonIdStr = seasonId ?? '';
  const contactIdStr = contactId ?? '';

  return (
    <LeaguePlayerProfile
      accountId={accountIdStr}
      seasonId={seasonIdStr}
      contactId={contactIdStr}
      playerName={playerName}
    />
  );
}
