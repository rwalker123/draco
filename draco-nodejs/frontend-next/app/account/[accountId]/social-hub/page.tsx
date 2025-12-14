import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import SocialHubClientWrapper from './SocialHubClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `See live streams, updates, and chat activity for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Social Hub`,
    description,
    path: `/account/${accountId}/social-hub`,
    icon: iconUrl,
    index: false,
  });
}

export default async function SocialHubPage({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);

  return <SocialHubClientWrapper accountId={accountId} />;
}
