import { getAccountName } from '../../../../../../lib/metadataFetchers';
import TeamsClientWrapper from './TeamsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Teams`,
  };
}

export default function Page() {
  return <TeamsClientWrapper />;
}
