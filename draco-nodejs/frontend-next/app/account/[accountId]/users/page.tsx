import { getAccountName } from '../../../../lib/metadataFetchers';
import UserManagementClientWrapper from './UserManagementClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `User Management - ${accountName}`,
    description: `Manage users and roles for ${accountName}`,
  };
}

export default function UserManagementPage() {
  return <UserManagementClientWrapper />;
}
