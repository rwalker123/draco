import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import ScheduleClientWrapper from './ScheduleClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Review upcoming games, practices, and events for ${accountName} with the live ${DEFAULT_SITE_NAME} schedule.`;
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
