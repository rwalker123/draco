import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import VerifyClassifiedClientWrapper from './VerifyClassifiedClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; id: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} - Verify Teams Wanted Classified`,
    description: `Verify access to your Teams Wanted classified ad for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function VerifyClassifiedPage() {
  return <VerifyClassifiedClientWrapper />;
}
