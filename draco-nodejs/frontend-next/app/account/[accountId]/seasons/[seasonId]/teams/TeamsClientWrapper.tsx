'use client';

import { useParams, useRouter } from 'next/navigation';
import Teams from '../../../../../../components/Teams';

export default function TeamsClientWrapper() {
  const params = useParams();
  const router = useRouter();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : params.seasonId;

  // Ensure both are strings
  const accountIdStr = accountId ?? '';
  const seasonIdStr = seasonId ?? '';

  // Pass both accountId and seasonId as props
  return <Teams accountId={accountIdStr} seasonId={seasonIdStr} router={router} />;
}
