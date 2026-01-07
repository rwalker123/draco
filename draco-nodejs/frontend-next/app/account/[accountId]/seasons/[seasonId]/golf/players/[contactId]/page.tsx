import { getAccountBranding } from '../../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../../lib/seoMetadata';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../lib/metadataParams';
import LeaguePlayerProfileClient from './LeaguePlayerProfileClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; contactId: string }>;
}) {
  const { accountId, seasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `View player handicap and league match scores for ${accountName}.`;

  return buildSeoMetadata({
    title: `Player Profile - ${accountName}`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/golf/players`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <LeaguePlayerProfileClient />;
}
