import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata } from '@/lib/seoMetadata';
import SeasonManagementClientWrapper from './SeasonManagementClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Create seasons, configure divisions, and manage competition settings for ${accountName}.`;
  return buildSeoMetadata({
    title: `Season Management - ${accountName}`,
    description,
    path: `/account/${accountId}/seasons`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <SeasonManagementClientWrapper />;
}
