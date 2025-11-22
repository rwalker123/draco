import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import SocialMediaManagementClientWrapper from './SocialMediaManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage YouTube, Discord, and other social media integrations for ${accountName}.`;
  return buildSeoMetadata({
    title: `Social Media Management - ${accountName}`,
    description,
    path: `/account/${accountId}/social-media`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <SocialMediaManagementClientWrapper />;
}
