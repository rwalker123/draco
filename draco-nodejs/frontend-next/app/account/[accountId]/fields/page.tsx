import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import FieldsClientWrapper from './FieldsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
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
