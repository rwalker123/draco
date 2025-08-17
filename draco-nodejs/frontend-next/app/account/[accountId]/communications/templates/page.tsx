import { getAccountName } from '../../../../../lib/metadataFetchers';
import TemplatesClientWrapper from './TemplatesClientWrapper';

// Dynamically set the page title to "{Account Name} Email Templates"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Email Templates`,
  };
}

export default function Page() {
  return <TemplatesClientWrapper />;
}
