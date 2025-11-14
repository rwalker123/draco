import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountVideosClientWrapper from './AccountVideosClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Watch the latest account and team videos for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Videos`,
    description,
    path: `/account/${accountId}/social-hub/videos`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountVideosClientWrapper />;
}
