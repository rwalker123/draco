import { getAccountBranding } from '../../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../../../../../../lib/seoMetadata';
import TeamRosterManagementClientWrapper from './TeamRosterManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage roster assignments, jersey numbers, and player details for ${accountName} inside ${DEFAULT_SITE_NAME}.`;
  return buildSeoMetadata({
    title: `${accountName} Team Roster`,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamRosterManagementClientWrapper />;
}
