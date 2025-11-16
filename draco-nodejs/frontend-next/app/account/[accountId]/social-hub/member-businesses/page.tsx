import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import MemberBusinessDirectoryClientWrapper from './MemberBusinessDirectoryClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Browse businesses owned by active ${accountName} members.`;

  return buildSeoMetadata({
    title: `${accountName} Member Businesses`,
    description,
    path: `/account/${accountId}/social-hub/member-businesses`,
    icon: iconUrl,
    index: false,
  });
}

export default function MemberBusinessesPage() {
  return <MemberBusinessDirectoryClientWrapper />;
}
