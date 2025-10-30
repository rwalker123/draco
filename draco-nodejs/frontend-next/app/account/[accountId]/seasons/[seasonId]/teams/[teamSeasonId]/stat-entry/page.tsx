import { getTeamInfo } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import TeamStatEntryPageClientWrapper from './TeamStatEntryPageClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await params;
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  const description = `${account} ${team} statistics entry and box scores for the ${league} league on Draco Sports Manager.`;

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
