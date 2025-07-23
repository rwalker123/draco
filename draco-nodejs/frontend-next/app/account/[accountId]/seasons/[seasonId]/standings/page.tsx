import { getAccountName } from '../../../../../../lib/metadataFetchers';
import StandingsClientWrapper from './StandingsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Standings`,
  };
}

export default function Page() {
  return <StandingsClientWrapper />;
}
