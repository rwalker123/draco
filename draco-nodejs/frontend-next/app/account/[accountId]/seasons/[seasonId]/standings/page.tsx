import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../lib/metadataParams';
import StandingsClientWrapper from './StandingsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string }>;
}) {
  const { accountId, seasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Check the latest standings and league rankings for ${accountName} teams this season.`;
  return buildSeoMetadata({
    title: `${accountName} Standings`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/standings`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <StandingsClientWrapper />;
}
