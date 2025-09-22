import { getAccountBranding } from '../../../../lib/metadataFetchers';
import UserManagementClientWrapper from './UserManagementClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `User Management - ${accountName}`,
    description: `Manage users and roles for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function UserManagementPage() {
  return <UserManagementClientWrapper />;
}
