import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import TeamsClientWrapper from './TeamsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Teams`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <TeamsClientWrapper />;
}
