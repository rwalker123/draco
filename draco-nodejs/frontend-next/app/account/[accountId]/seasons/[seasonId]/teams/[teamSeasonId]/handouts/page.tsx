import { getTeamInfo } from '../../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../../lib/seoMetadata';
import TeamHandoutsClient from './TeamHandoutsClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await params;
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  const title = `${team} Handouts`;
  const description = `Download documents shared with the ${team} of the ${league} at ${account}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/handouts`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamHandoutsClient />;
}
