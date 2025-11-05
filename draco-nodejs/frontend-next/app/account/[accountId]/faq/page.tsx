import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import LeagueFaqPublicClientWrapper from './LeagueFaqPublicClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Browse frequently asked questions for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} FAQs`,
    description,
    path: `/account/${accountId}/faq`,
    icon: iconUrl,
    index: false,
  });
}

export default function LeagueFaqPublicPage() {
  return <LeagueFaqPublicClientWrapper />;
}
