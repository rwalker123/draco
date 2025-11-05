import { getTeamInfo } from '../../../../../../../../../lib/metadataFetchers';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../../lib/metadataParams';
import TeamSponsorManagementClient from './TeamSponsorManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);

  return {
    title: `Sponsor Management - ${team}`,
    description: `Manage sponsors for ${league} ${team} within ${account}.`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function TeamSponsorManagementPage() {
  return <TeamSponsorManagementClient />;
}
