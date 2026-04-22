import { getTeamInfo } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import TeamEmailComposeClient from './TeamEmailComposeClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);

  return buildSeoMetadata({
    title: `${team} Compose Email | ${account}`,
    description: `Compose and send an email to the ${team} roster.`,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/communications/compose`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamEmailComposeClient />;
}
