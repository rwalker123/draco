import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import ComposeClientWrapper from './ComposeClientWrapper';

// Dynamically set the page title to "{Account Name} Compose Email"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Compose Email`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <ComposeClientWrapper />;
}
