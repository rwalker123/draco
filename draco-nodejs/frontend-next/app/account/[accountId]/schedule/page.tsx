"use client";
import ScheduleManagement from '../../../../components/ScheduleManagement';
import { useParams } from 'next/navigation';

export default function Page() {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  return <ScheduleManagement accountId={accountIdStr || ''} />;
}
