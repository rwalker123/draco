import { getAccountBranding } from '../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../../lib/metadataParams';
import TeamAnnouncementsManagementClient from './TeamAnnouncementsManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; teamId: string }>;
}) {
  const { accountId, teamId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);

  return buildSeoMetadata({
    title: `${accountName} Team Announcements`,
    description: `Manage team announcements for ${accountName}.`,
    path: `/account/${accountId}/teams/${teamId}/announcements/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamAnnouncementsManagementClient />;
}
