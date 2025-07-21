import { getAccountName } from '../../../../lib/metadataFetchers';
import StatisticsClientWrapper from './StatisticsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Statistics`,
    description: `View detailed baseball statistics for ${accountName}`,
  };
}

export default function StatisticsPage() {
  return <StatisticsClientWrapper />;
}
