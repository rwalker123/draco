import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountHandoutManagementClient from './AccountHandoutManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage the handouts available to ${accountName} members.`;

  return buildSeoMetadata({
    title: `${accountName} Handout Management`,
    description,
    path: `/account/${accountId}/handouts/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountHandoutManagementClient />;
}
