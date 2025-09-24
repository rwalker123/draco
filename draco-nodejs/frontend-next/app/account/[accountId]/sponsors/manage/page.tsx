import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import AccountSponsorManagementClient from './AccountSponsorManagementClient';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
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
