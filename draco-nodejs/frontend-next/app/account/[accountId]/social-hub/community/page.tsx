import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountCommunityMessagesClientWrapper from './AccountCommunityMessagesClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Browse every synced Discord conversation for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Community Messages`,
    description,
    path: `/account/${accountId}/social-hub/community`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountCommunityMessagesClientWrapper />;
}
