import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../lib/metadataParams';
import TeamsClientWrapper from './TeamsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string }>;
}) {
  const { accountId, seasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Explore rosters, divisions, and program details for ${accountName} teams in the current season.`;
  return buildSeoMetadata({
    title: `${accountName} Teams`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <TeamsClientWrapper />;
}
