import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import PublicPlayerProfileClient from './PublicPlayerProfileClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; playerId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);

  return buildSeoMetadata({
    title: `${accountName} Player Profile`,
    description: `Player profile and current-season team affiliations for ${accountName}.`,
    path: `/account/${accountId}/players`,
    icon: iconUrl,
  });
}

export default function PublicPlayerProfilePage() {
  return <PublicPlayerProfileClient />;
}
