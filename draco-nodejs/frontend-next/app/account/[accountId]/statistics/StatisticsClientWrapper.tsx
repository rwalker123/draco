'use client';

import { useParams } from 'next/navigation';
import Statistics from './Statistics';

export default function StatisticsClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const accountIdStr = accountId ?? '';

  return <Statistics accountId={accountIdStr} />;
}
