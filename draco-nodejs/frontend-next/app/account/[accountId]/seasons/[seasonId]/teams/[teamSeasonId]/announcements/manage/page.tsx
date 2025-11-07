import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import TeamAnnouncementsManagementClient from './TeamAnnouncementsManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);

  return buildSeoMetadata({
    title: `${accountName} Team Announcements`,
    description: `Manage team announcements for ${accountName}.`,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/announcements/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamAnnouncementsManagementClient />;
}
