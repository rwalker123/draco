import { redirect } from 'next/navigation';
import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';

// Dynamically set the page title to "{Account Name} Email History"
export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
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

export default async function Page({ params }: { params: MetadataParams<{ accountId: string }> }) {
  const { accountId } = await resolveRouteParams(params);
  redirect(`/account/${accountId}/communications`);
}
