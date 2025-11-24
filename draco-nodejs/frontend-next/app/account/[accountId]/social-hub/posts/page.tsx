import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountSocialPostsClientWrapper from './AccountSocialPostsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Browse all social messages we have ingested for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Social Messages`,
    description,
    path: `/account/${accountId}/social-hub/posts`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountSocialPostsClientWrapper />;
}
