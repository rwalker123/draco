import { getAccountBranding } from '../../../../lib/metadataFetchers';
import PlayerClassifiedsClientWrapper from './PlayerClassifiedsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Player Classifieds`,
    description: `Find players and teams through classified ads for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function PlayerClassifiedsPage() {
  return <PlayerClassifiedsClientWrapper />;
}
