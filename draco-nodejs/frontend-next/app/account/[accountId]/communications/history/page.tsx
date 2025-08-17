import { getAccountName } from '../../../../../lib/metadataFetchers';
import HistoryClientWrapper from './HistoryClientWrapper';

// Dynamically set the page title to "{Account Name} Email History"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Email History`,
  };
}

export default function Page() {
  return <HistoryClientWrapper />;
}
