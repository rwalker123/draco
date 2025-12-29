import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import CommunityAdminClient from './CommunityAdminClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Community Admin`;
  const description = `Engage with your community through announcements, polls, surveys, and photo galleries for ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/admin/community`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <CommunityAdminClient />;
}
