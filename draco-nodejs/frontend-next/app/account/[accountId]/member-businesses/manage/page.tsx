import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountMemberBusinessManagementClient from './AccountMemberBusinessManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `Member Business Management - ${accountName}`,
    description: `Manage member businesses for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function AccountMemberBusinessManagementPage() {
  return <AccountMemberBusinessManagementClient />;
}
