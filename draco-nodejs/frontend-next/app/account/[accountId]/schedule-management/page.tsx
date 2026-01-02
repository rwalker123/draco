import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import ScheduleManagementClientWrapper from './ScheduleManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage game schedules, create and edit games for ${accountName} with ${DEFAULT_SITE_NAME}.`;
  return buildSeoMetadata({
    title: `${accountName} Schedule Management`,
    description,
    path: `/account/${accountId}/schedule-management`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <ScheduleManagementClientWrapper />;
}
