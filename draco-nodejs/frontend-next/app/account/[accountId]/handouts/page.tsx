import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import AccountHandoutsClient from './AccountHandoutsClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Download documents and resources shared by ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Handouts`,
    description,
    path: `/account/${accountId}/handouts`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountHandoutsClient />;
}
