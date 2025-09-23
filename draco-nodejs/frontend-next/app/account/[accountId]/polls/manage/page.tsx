import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import PollManagementClientWrapper from './PollManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Poll Management`,
    description: `Manage polls for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function PollManagementPage() {
  return <PollManagementClientWrapper />;
}
