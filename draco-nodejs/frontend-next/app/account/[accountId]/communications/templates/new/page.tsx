import { getAccountName } from '../../../../../../lib/metadataFetchers';
import CreateTemplateClientWrapper from './CreateTemplateClientWrapper';

// Dynamically set the page title to "{Account Name} Create Email Template"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Create Email Template`,
  };
}

export default function Page() {
  return <CreateTemplateClientWrapper />;
}
