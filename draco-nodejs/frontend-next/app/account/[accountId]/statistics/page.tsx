import { getAccountBranding } from '../../../../lib/metadataFetchers';
import StatisticsClientWrapper from './StatisticsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Statistics`,
    description: `View detailed baseball statistics for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function StatisticsPage() {
  return <StatisticsClientWrapper />;
}
