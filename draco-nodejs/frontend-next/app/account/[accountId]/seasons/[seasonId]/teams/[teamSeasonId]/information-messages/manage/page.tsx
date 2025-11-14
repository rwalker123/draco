import { getAccountBranding } from '../../../../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../../../../lib/seoMetadata';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../../lib/metadataParams';
import TeamInformationMessagesManagementClient from './TeamInformationMessagesManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Team Information Messages`;
  const description = `Manage information messages for this team within ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/information-messages/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamInformationMessagesManagementClient />;
}
