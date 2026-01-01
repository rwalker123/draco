import { getAccountBranding } from '../../../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../../../lib/metadataParams';
import { buildSeoMetadata } from '../../../../../../../lib/seoMetadata';
import GolfFlightsAdminClientWrapper from './GolfFlightsAdminClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string }>;
}) {
  const { accountId, seasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage golf flights and settings for ${accountName}.`;
  return buildSeoMetadata({
    title: `${accountName} Flights Administration`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/golf/admin`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <GolfFlightsAdminClientWrapper />;
}
