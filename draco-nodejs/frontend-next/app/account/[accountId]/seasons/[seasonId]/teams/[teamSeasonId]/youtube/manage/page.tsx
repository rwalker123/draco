import { getTeamInfo } from '../../../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../../../lib/seoMetadata';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../../lib/metadataParams';
import TeamYouTubeManagementClient from './TeamYouTubeManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  const title = `${team} YouTube Management`;
  const description = `Connect and manage the YouTube channel for the ${team} of the ${league} at ${account}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/youtube/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamYouTubeManagementClient />;
}
