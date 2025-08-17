import { getAccountName } from '../../../../../lib/metadataFetchers';
import ComposeClientWrapper from './ComposeClientWrapper';

// Dynamically set the page title to "{Account Name} Compose Email"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Compose Email`,
  };
}

export default function Page() {
  return <ComposeClientWrapper />;
}
