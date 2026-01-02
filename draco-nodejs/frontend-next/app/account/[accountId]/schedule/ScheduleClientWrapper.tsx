'use client';
import { useParams } from 'next/navigation';
import Schedule from './Schedule';

export default function ScheduleClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId)
    ? params.accountId[0]
    : (params.accountId ?? '');
  return <Schedule accountId={accountId} />;
}
