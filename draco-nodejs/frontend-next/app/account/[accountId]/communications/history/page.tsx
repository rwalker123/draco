import { redirect } from 'next/navigation';
import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';

// Dynamically set the page title to "{Account Name} Email History"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Review delivery results, engagement metrics, and archived messages for ${accountName}.`;
  return buildSeoMetadata({
    title: `${accountName} Email History`,
    description,
    path: `/account/${accountId}/communications/history`,
    icon: iconUrl,
    index: false,
  });
}

export default async function Page({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  redirect(`/account/${accountId}/communications`);
}
