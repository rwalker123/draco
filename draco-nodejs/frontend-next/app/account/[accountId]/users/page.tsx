import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import UserManagementClientWrapper from './UserManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
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
