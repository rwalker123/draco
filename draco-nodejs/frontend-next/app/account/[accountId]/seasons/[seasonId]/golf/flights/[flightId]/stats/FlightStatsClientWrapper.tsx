'use client';

import { useParams, useSearchParams } from 'next/navigation';
import AccountTypeGuard from '../../../../../../../../../components/auth/AccountTypeGuard';
import FlightStatsPage from '../../../../../../../../../components/golf/stats/FlightStatsPage';

export default function FlightStatsClientWrapper() {
  const params = useParams();
  const searchParams = useSearchParams();

  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : params.seasonId;
  const flightId = Array.isArray(params.flightId) ? params.flightId[0] : params.flightId;
  const flightName = searchParams.get('name') ?? 'Flight';

  const accountIdStr = accountId ?? '';
  const seasonIdStr = seasonId ?? '';
  const flightIdStr = flightId ?? '';

  return (
    <AccountTypeGuard requiredAccountType="golf">
      <FlightStatsPage
        accountId={accountIdStr}
        seasonId={seasonIdStr}
        flightId={flightIdStr}
        flightName={flightName}
      />
    </AccountTypeGuard>
  );
}
