import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import TemplatesClientWrapper from './TemplatesClientWrapper';

// Dynamically set the page title to "{Account Name} Email Templates"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Email Templates`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <TemplatesClientWrapper />;
}
