import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import AccountHandoutManagementClient from './AccountHandoutManagementClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
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
