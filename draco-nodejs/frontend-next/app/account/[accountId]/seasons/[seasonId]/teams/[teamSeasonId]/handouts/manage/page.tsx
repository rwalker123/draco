import { getTeamInfo } from '../../../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../../../lib/seoMetadata';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../../lib/metadataParams';
import TeamHandoutManagementClient from './TeamHandoutManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);
  const title = `${team} Handout Management`;
  const description = `Manage the handouts available to the ${team} of the ${league} at ${account}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/handouts/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamHandoutManagementClient />;
}
