import { getAccountBranding } from '../../../../../../../../../lib/metadataFetchers';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../../lib/metadataParams';
import { buildSeoMetadata } from '../../../../../../../../../lib/seoMetadata';
import FlightStatsClientWrapper from './FlightStatsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; flightId: string }>;
}) {
  const { accountId, seasonId, flightId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `View flight statistics and leaderboards for ${accountName}.`;
  return buildSeoMetadata({
    title: `${accountName} Flight Stats`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/golf/flights/${flightId}/stats`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <FlightStatsClientWrapper />;
}
