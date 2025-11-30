import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../../lib/metadataParams';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import LeagueSeasonManagementClientWrapper from './LeagueSeasonManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string }>;
}) {
  const { accountId, seasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage league seasons, divisions, and team assignments for ${accountName}.`;
  return buildSeoMetadata({
    title: `{accountName} League Season Management`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/league-seasons`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <LeagueSeasonManagementClientWrapper />;
}
