import { getAccountBranding } from '../../../../lib/metadataFetchers';
import AccountHomeClientWrapper from './AccountHomeClientWrapper';

// Dynamically set the page title to "{Account Name} Home"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Home`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <AccountHomeClientWrapper />;
}
