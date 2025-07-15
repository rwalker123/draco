import { getTeamInfo } from '../../../../../../../lib/metadataFetchers';
import TeamPageClientWrapper from './TeamPageClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await params;
  const { account, league, team } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  return {
    title: `${account} ${league} ${team}`,
  };
}

export default function Page() {
  return <TeamPageClientWrapper />;
}
