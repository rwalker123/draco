import { getAccountBranding } from '../../../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../../../lib/metadataParams';
import { buildSeoMetadata } from '../../../../../../../lib/seoMetadata';
import GolfFlightManagementClientWrapper from './GolfFlightManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string }>;
}) {
  const { accountId, seasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage golf flights and teams for ${accountName}.`;
  return buildSeoMetadata({
    title: `${accountName} Golf Flight Management`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/golf/flights`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <GolfFlightManagementClientWrapper />;
}
