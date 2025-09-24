import { getAccountBranding } from '../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../lib/seoMetadata';
import EditTemplateClientWrapper from './EditTemplateClientWrapper';

// Dynamically set the page title to "{Account Name} Edit Email Template"
export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; templateId: string }>;
}) {
  const { accountId, templateId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Edit reusable messaging content for ${accountName} to keep communications consistent and on-brand.`;
  return buildSeoMetadata({
    title: `${accountName} Edit Email Template`,
    description,
    path: `/account/${accountId}/communications/templates/${templateId}/edit`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <EditTemplateClientWrapper />;
}
