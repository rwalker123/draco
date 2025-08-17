import { getAccountName } from '../../../../lib/metadataFetchers';
import PlayerClassifiedsClientWrapper from './PlayerClassifiedsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `Player Classifieds - ${accountName}`,
    description: `Find players and teams through classified ads for ${accountName}`,
  };
}

export default function PlayerClassifiedsPage() {
  return <PlayerClassifiedsClientWrapper />;
}
