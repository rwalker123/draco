import { getTeamInfo } from '../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../../lib/metadataParams';
import TeamPageClientWrapper from './TeamPageClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  const description = `${account} ${team} from the ${league} league on ${DEFAULT_SITE_NAME} with schedule, roster, and results.`;
  return buildSeoMetadata({
    title: `${account} ${league} ${team}`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <TeamPageClientWrapper />;
}
