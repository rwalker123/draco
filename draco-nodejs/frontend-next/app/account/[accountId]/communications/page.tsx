import { getAccountBranding } from '../../../../lib/metadataFetchers';
import CommunicationsClientWrapper from './CommunicationsClientWrapper';

// Dynamically set the page title to "{Account Name} Communications"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Communications`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <CommunicationsClientWrapper />;
}
