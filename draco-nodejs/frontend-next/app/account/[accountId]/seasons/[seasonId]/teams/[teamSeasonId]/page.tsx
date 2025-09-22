import { getTeamInfo } from '../../../../../../../lib/metadataFetchers';
import TeamPageClientWrapper from './TeamPageClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await params;
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  return {
    title: `${account} ${league} ${team}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <TeamPageClientWrapper />;
}
