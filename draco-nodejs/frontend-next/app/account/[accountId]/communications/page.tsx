import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import CommunicationsClientWrapper from './CommunicationsClientWrapper';

// Dynamically set the page title to "{Account Name} Communications"
export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
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
