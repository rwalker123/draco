'use client';

import { useParams } from 'next/navigation';
import Standings from './Standings';

export default function StandingsClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : params.seasonId;

  const accountIdStr = accountId ?? '';
  const seasonIdStr = seasonId ?? '';

  return <Standings accountId={accountIdStr} seasonId={seasonIdStr} />;
}
