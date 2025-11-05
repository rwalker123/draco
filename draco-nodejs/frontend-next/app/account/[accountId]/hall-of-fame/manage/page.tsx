import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import HallOfFameManagementClient from './HallOfFameManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);

  return {
    title: `${accountName} Hall of Fame Management`,
    description: `Manage Hall of Fame members, nominations, and settings for ${accountName}.`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function HallOfFameManagementPage() {
  return <HallOfFameManagementClient />;
}
