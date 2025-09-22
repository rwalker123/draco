import { getAccountBranding } from '../../../../../../../../lib/metadataFetchers';
import TeamRosterManagementClientWrapper from './TeamRosterManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Team Roster`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function Page() {
  return <TeamRosterManagementClientWrapper />;
}
