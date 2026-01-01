import { getAccountBranding } from '../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../../lib/metadataParams';
import GolfTeamsClient from './GolfTeamsClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage golf teams for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Golf Teams`,
    description,
    path: `/account/${accountId}/golf/teams`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <GolfTeamsClient />;
}
