import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import PollManagementClientWrapper from './PollManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
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
