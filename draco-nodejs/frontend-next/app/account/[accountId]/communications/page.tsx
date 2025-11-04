import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../../lib/seoMetadata';
import CommunicationsClientWrapper from './CommunicationsClientWrapper';

// Dynamically set the page title to "{Account Name} Communications"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Send announcements, email campaigns, and alerts to ${accountName} members through ${DEFAULT_SITE_NAME}.`;
  return buildSeoMetadata({
    title: `${accountName} Communications`,
    description,
    path: `/account/${accountId}/communications`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <CommunicationsClientWrapper />;
}
