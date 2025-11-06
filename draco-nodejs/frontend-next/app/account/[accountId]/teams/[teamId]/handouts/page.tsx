import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../lib/metadataParams';
import TeamHandoutsClientWrapper from './TeamHandoutsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; teamId: string }>;
}) {
  const { accountId, teamId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Team Handouts`;
  const description = `Download the team handouts available to members of ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/teams/${teamId}/handouts`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TeamHandoutsClientWrapper />;
}
