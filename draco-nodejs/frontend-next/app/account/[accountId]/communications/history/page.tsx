import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import HistoryClientWrapper from './HistoryClientWrapper';

// Dynamically set the page title to "{Account Name} Email History"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Email History`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <HistoryClientWrapper />;
}
