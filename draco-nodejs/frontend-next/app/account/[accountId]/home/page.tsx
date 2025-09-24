import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import AccountHomeClientWrapper from './AccountHomeClientWrapper';

// Dynamically set the page title to "{Account Name} Home"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Catch up on announcements, quick stats, and featured content from ${accountName} on Draco Sports Manager.`;
  return buildSeoMetadata({
    title: `${accountName} Home`,
    description,
    path: `/account/${accountId}/home`,
    icon: iconUrl,
  });
}

export default function Page() {
  return <AccountHomeClientWrapper />;
}
