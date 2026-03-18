import { getAccountBranding } from '../../../../../../../../../lib/metadataFetchers';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../../lib/metadataParams';
import { buildSeoMetadata } from '../../../../../../../../../lib/seoMetadata';
import SubstitutesClientWrapper from './SubstitutesClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; leagueSeasonId: string }>;
}) {
  const { accountId, seasonId, leagueSeasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return buildSeoMetadata({
    title: `${accountName} - League Substitutes`,
    description: `Manage league substitutes for ${accountName}.`,
    path: `/account/${accountId}/seasons/${seasonId}/golf/leagues/${leagueSeasonId}/substitutes`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <SubstitutesClientWrapper />;
}
