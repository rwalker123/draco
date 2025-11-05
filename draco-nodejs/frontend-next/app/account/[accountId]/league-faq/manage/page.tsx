import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import LeagueFaqClientWrapper from './LeagueFaqClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage frequently asked questions for ${accountName} to help members find answers quickly.`;

  return buildSeoMetadata({
    title: `${accountName} FAQ Management`,
    description,
    path: `/account/${accountId}/league-faq/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function LeagueFaqPage() {
  return <LeagueFaqClientWrapper />;
}
