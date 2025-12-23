import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import UmpiresManagementClient from './UmpiresManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Umpire Management`;
  const description = `Manage umpire details and assignments for ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/umpires/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function UmpiresManagementPage() {
  return <UmpiresManagementClient />;
}
