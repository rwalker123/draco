import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import FieldsManagementClient from './FieldsManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Field Management`;
  const description = `Manage field details and availability for ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/fields/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <FieldsManagementClient />;
}
