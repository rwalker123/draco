import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import CreateTemplateClientWrapper from './CreateTemplateClientWrapper';

// Dynamically set the page title to "{Account Name} Create Email Template"
export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Build new branded email templates for ${accountName} to streamline recurring communications.`;
  return buildSeoMetadata({
    title: `${accountName} Create Email Template`,
    description,
    path: `/account/${accountId}/communications/templates/new`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <CreateTemplateClientWrapper />;
}
