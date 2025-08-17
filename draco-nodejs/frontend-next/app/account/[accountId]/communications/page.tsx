import { getAccountName } from '../../../../lib/metadataFetchers';
import CommunicationsClientWrapper from './CommunicationsClientWrapper';

// Dynamically set the page title to "{Account Name} Communications"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Communications`,
  };
}

export default function Page() {
  return <CommunicationsClientWrapper />;
}
