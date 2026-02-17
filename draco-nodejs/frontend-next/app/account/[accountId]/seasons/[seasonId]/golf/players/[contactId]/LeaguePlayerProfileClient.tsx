'use client';

import { useParams, useSearchParams } from 'next/navigation';
import LeaguePlayerProfile from '@/components/golf/player/LeaguePlayerProfile';

export default function LeaguePlayerProfileClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const contactId = Array.isArray(params.contactId) ? params.contactId[0] : params.contactId;
  const playerName = searchParams.get('name') ?? undefined;

  const accountIdStr = accountId ?? '';
  const contactIdStr = contactId ?? '';

  return (
    <LeaguePlayerProfile
      accountId={accountIdStr}
      contactId={contactIdStr}
      playerName={playerName}
    />
  );
}
