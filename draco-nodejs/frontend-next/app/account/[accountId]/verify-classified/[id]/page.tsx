import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import VerifyClassifiedClientWrapper from './VerifyClassifiedClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; id: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Verify your Teams Wanted classified submission for ${accountName} to ensure the listing appears to coaches and recruiters.`;
  return buildSeoMetadata({
    title: `${accountName} - Verify Teams Wanted Classified`,
    description,
    path: `/account/${accountId}/verify-classified/${id}`,
    icon: iconUrl,
    index: false,
  });
}

export default function VerifyClassifiedPage() {
  return <VerifyClassifiedClientWrapper />;
}
