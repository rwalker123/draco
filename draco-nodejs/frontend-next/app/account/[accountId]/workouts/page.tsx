import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import WorkoutsClientWrapper from './WorkoutsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Design and publish skill development workouts tailored for ${accountName} athletes.`;
  return buildSeoMetadata({
    title: `${accountName} Workouts`,
    description,
    path: `/account/${accountId}/workouts`,
    icon: iconUrl,
    index: false,
  });
}

export default function WorkoutsPage() {
  return <WorkoutsClientWrapper />;
}
