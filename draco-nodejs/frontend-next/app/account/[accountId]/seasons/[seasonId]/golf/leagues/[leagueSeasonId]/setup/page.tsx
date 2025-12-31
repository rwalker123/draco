import { getAccountBranding } from '../../../../../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../../../../../lib/metadataParams';
import { buildSeoMetadata } from '../../../../../../../../../lib/seoMetadata';
import GolfLeagueSetupClientWrapper from './GolfLeagueSetupClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; leagueSeasonId: string }>;
}) {
  const { accountId, seasonId, leagueSeasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Configure golf season settings for ${accountName}.`;
  return buildSeoMetadata({
    title: `${accountName} Season Setup`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/golf/leagues/${leagueSeasonId}/setup`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <GolfLeagueSetupClientWrapper />;
}
