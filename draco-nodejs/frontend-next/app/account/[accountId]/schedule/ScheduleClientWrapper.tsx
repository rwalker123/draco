'use client';
import { useParams } from 'next/navigation';
import ScheduleManagement from '../../../../components/ScheduleManagement';

export default function ScheduleClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params.accountId)
    ? params.accountId[0]
    : (params.accountId ?? '');
  return <ScheduleManagement accountId={accountId} />;
}
