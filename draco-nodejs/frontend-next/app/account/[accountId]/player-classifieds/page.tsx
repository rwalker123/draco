import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import PlayerClassifiedsClientWrapper from './PlayerClassifiedsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Browse player needs and opportunities for ${accountName} teams on Draco Sports Manager's player classifieds.`;
  return buildSeoMetadata({
    title: `${accountName} Player Classifieds`,
    description,
    path: `/account/${accountId}/player-classifieds`,
    icon: iconUrl,
  });
}

export default function PlayerClassifiedsPage() {
  return <PlayerClassifiedsClientWrapper />;
}
