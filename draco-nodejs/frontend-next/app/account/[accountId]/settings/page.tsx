import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import AccountSettingsClientWrapper from './AccountSettingsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Configure branding, permissions, and contact information for ${accountName}.`;
  return buildSeoMetadata({
    title: `Account Settings - ${accountName}`,
    description,
    path: `/account/${accountId}/settings`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountSettingsClientWrapper />;
}
