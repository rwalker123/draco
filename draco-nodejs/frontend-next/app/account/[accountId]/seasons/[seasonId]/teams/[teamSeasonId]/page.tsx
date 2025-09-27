import { getTeamInfo } from '../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../lib/seoMetadata';
import TeamPageClientWrapper from './TeamPageClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await params;
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  const description = `${account} ${team} from the ${league} league on Draco Sports Manager with schedule, roster, and results.`;
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
