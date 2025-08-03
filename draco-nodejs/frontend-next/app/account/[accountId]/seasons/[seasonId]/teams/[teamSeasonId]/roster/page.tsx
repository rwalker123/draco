import { getAccountName } from '../../../../../../../../lib/metadataFetchers';
import TeamRosterManagementClientWrapper from './TeamRosterManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Team Roster`,
  };
}

export default function Page() {
  return <TeamRosterManagementClientWrapper />;
}
