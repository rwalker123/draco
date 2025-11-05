import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import FieldsClientWrapper from './FieldsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Explore and manage ballpark locations for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Fields`,
    description,
    path: `/account/${accountId}/fields`,
    icon: iconUrl,
    index: false,
  });
}

export default function FieldsPage() {
  return <FieldsClientWrapper />;
}
