import { getTeamInfo } from '../../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../../lib/seoMetadata';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../lib/metadataParams';
import TeamVideosClientWrapper from './TeamVideosClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  const title = `${team} Videos`;
  const description = `Watch every video ingested for the ${team} of the ${league} at ${account}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/videos`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <TeamVideosClientWrapper />;
}
