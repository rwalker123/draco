import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../lib/metadataParams';
import CreateTemplateClientWrapper from './CreateTemplateClientWrapper';

// Dynamically set the page title to "{Account Name} Create Email Template"
export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
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
