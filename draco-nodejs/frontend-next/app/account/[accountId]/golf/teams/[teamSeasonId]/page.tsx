import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../lib/metadataParams';
import GolfTeamDetailClient from './GolfTeamDetailClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; teamSeasonId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `View and manage team roster for ${accountName}.`;

  return buildSeoMetadata({
    title: `Team Details - ${accountName}`,
    description,
    path: `/account/${accountId}/golf/teams`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <GolfTeamDetailClient />;
}
