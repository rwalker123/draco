import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import AccountMemberBusinessManagementClient from './AccountMemberBusinessManagementClient';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
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
