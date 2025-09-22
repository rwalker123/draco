import { getAccountBranding } from '@/lib/metadataFetchers';
import AccountSettingsClientWrapper from './AccountSettingsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `Account Settings - ${accountName}`,
    description: `Manage account configuration details for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <AccountSettingsClientWrapper />;
}
