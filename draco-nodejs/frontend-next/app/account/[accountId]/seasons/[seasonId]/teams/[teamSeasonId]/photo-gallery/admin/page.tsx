import { getTeamInfo } from '../../../../../../../../../lib/metadataFetchers';
import {
  resolveRouteParams,
  type MetadataParams,
} from '../../../../../../../../../lib/metadataParams';
import { buildSeoMetadata } from '../../../../../../../../../lib/seoMetadata';
import TeamPhotoGalleryAdminClient from './TeamPhotoGalleryAdminClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; seasonId: string; teamSeasonId: string }>;
}) {
  const { accountId, seasonId, teamSeasonId } = await resolveRouteParams(params);
  const { account, league, team, iconUrl } = await getTeamInfo(accountId, seasonId, teamSeasonId);

  return buildSeoMetadata({
    title: `${team} Photo Gallery | ${account}`,
    description: `Manage the photo gallery for ${team} in the ${league} league.`,
    path: `/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/photo-gallery/admin`,
    icon: iconUrl,
    index: false,
  });
}

export default function TeamPhotoGalleryAdminPage() {
  return <TeamPhotoGalleryAdminClient />;
}
