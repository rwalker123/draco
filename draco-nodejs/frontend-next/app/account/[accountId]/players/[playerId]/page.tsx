import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import PublicPlayerProfileClientWrapper from './PublicPlayerProfileClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; playerId: string }>;
}) {
  const { accountId, playerId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);

  return buildSeoMetadata({
    title: `${accountName} Player Profile`,
    description: `Player profile and current-season team affiliations for ${accountName}.`,
    path: `/account/${accountId}/players/${playerId}`,
    icon: iconUrl,
  });
}

export default function PublicPlayerProfilePage() {
  return <PublicPlayerProfileClientWrapper />;
}
