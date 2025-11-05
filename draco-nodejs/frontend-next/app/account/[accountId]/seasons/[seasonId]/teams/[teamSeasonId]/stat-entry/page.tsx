import { getTeamInfo } from '@/lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import TeamStatEntryPageClientWrapper from './TeamStatEntryPageClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  const description = `${account} ${team} statistics entry and box scores for the ${league} league on ${DEFAULT_SITE_NAME}.`;

  return buildSeoMetadata({
    title: `${team} Game Statistics`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/stat-entry`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <TeamStatEntryPageClientWrapper />;
}
