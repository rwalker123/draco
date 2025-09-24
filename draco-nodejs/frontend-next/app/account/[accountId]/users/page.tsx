import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import UserManagementClientWrapper from './UserManagementClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage staff access, invitations, and role assignments for ${accountName}.`;
  return buildSeoMetadata({
    title: `User Management - ${accountName}`,
    description,
    path: `/account/${accountId}/users`,
    icon: iconUrl,
    index: false,
  });
}

export default function UserManagementPage() {
  return <UserManagementClientWrapper />;
}
