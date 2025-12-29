import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import AdminHubClient from './AdminHubClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Admin`;
  const description = `Administration hub for ${accountName}. Manage account settings, seasons, community engagement, and content.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/admin`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AdminHubClient />;
}
