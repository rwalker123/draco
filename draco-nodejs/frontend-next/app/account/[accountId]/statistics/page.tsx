import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import StatisticsClientWrapper from './StatisticsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Dive into advanced stats, leaderboards, and performance trends for ${accountName} on Draco Sports Manager.`;
  return buildSeoMetadata({
    title: `${accountName} Statistics`,
    description,
    path: `/account/${accountId}/statistics`,
    icon: iconUrl,
  });
}

export default function StatisticsPage() {
  return <StatisticsClientWrapper />;
}
