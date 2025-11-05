import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import AccountHandoutsClient from './AccountHandoutsClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Download documents and resources shared by ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Handouts`,
    description,
    path: `/account/${accountId}/handouts`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountHandoutsClient />;
}
