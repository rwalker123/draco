import { getAccountName } from '@/lib/metadataFetchers';
import ScheduleClientWrapper from './ScheduleClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Schedule`,
  };
}

export default function Page() {
  return <ScheduleClientWrapper />;
}
