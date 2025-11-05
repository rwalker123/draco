import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import StatisticsClientWrapper from './StatisticsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Dive into advanced stats, leaderboards, and performance trends for ${accountName} on ${DEFAULT_SITE_NAME}.`;
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
