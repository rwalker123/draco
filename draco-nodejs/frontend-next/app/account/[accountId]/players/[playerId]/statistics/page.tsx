import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import PlayerStatisticsClientWrapper from './PlayerStatisticsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; playerId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);

  const title = `${accountName} Player Statistics`;
  const description = `Lifetime batting and pitching data for players in ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/players`,
    icon: iconUrl,
  });
}

export default function PlayerStatisticsPage() {
  return <PlayerStatisticsClientWrapper />;
}
