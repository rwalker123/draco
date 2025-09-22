import { getAccountBranding } from '@/lib/metadataFetchers';
import SeasonManagementClientWrapper from './SeasonManagementClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `Season Management - ${accountName}`,
    description: `Manage seasons and league assignments for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <SeasonManagementClientWrapper />;
}
