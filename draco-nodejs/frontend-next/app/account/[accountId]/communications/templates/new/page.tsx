import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import CreateTemplateClientWrapper from './CreateTemplateClientWrapper';

// Dynamically set the page title to "{Account Name} Create Email Template"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Create Email Template`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <CreateTemplateClientWrapper />;
}
