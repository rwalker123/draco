import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountAdminClient from './AccountAdminClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Account Admin`;
  const description = `Manage account settings, users, communications, and business relationships for ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/admin/account`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountAdminClient />;
}
