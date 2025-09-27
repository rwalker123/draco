import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import ScheduleClientWrapper from './ScheduleClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Review upcoming games, practices, and events for ${accountName} with the live Draco Sports Manager schedule.`;
  return buildSeoMetadata({
    title: `${accountName} Schedule`,
    description,
    path: `/account/${accountId}/schedule`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <ScheduleClientWrapper />;
}
