import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import SeasonAdminClient from './SeasonAdminClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Season Admin`;
  const description = `Manage seasons, fields, umpires, and workouts for ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/admin/season`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <SeasonAdminClient />;
}
