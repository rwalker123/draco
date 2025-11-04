import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../../lib/seoMetadata';
import PlayerClassifiedsClientWrapper from './PlayerClassifiedsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Browse player needs and opportunities for ${accountName} teams on ${DEFAULT_SITE_NAME} player classifieds.`;
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
