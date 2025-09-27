import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import ComposeClientWrapper from './ComposeClientWrapper';

// Dynamically set the page title to "{Account Name} Compose Email"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Create personalized announcements and targeted messages for ${accountName} recipients.`;
  return buildSeoMetadata({
    title: `${accountName} Compose Email`,
    description,
    path: `/account/${accountId}/communications/compose`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <ComposeClientWrapper />;
}
