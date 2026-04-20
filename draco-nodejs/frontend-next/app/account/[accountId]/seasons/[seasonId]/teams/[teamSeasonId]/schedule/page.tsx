import { getTeamInfo } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import TeamScheduleClient from './TeamScheduleClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);

  return buildSeoMetadata({
    title: `${team} Schedule | ${account}`,
    description: `View the full season schedule for ${team} in the ${league} league.`,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/schedule`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamScheduleClient />;
}
