import { getAccountName } from '../../../../../../../lib/metadataFetchers';
import EditTemplateClientWrapper from './EditTemplateClientWrapper';

// Dynamically set the page title to "{Account Name} Edit Email Template"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Edit Email Template`,
  };
}

export default function Page() {
  return <EditTemplateClientWrapper />;
}
