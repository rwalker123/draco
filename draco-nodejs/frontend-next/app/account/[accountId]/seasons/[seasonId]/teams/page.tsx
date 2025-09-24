import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import TeamsClientWrapper from './TeamsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId, seasonId } = await params;
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
