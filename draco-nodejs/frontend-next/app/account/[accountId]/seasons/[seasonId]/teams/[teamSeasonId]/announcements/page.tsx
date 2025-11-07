import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import TeamAnnouncementsClient from './TeamAnnouncementsClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Team Announcements`;
  const description = `Stay informed with announcements shared with your ${accountName} team.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/announcements`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamAnnouncementsClient />;
}
