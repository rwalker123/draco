import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../lib/metadataParams';
import TeamAnnouncementsClient from './TeamAnnouncementsClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; teamId: string }>;
}) {
  const { accountId, teamId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Team Announcements`;
  const description = `Review announcements shared with your ${accountName} team.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/teams/${teamId}/announcements`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamAnnouncementsClient />;
}
