import { getAccountBranding } from '@/lib/metadataFetchers';
import ScheduleClientWrapper from './ScheduleClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Schedule`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <ScheduleClientWrapper />;
}
