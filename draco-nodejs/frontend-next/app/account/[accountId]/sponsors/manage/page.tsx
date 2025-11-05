import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountSponsorManagementClient from './AccountSponsorManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `Sponsor Management - ${accountName}`,
    description: `Manage sponsors for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function AccountSponsorManagementPage() {
  return <AccountSponsorManagementClient />;
}
