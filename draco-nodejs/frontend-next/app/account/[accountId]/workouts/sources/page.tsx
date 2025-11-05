import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import WorkoutSourcesClientWrapper from './WorkoutSourcesClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Customize where-heard options and lead sources for ${accountName} workout registrations.`;
  return buildSeoMetadata({
    title: `Workout Where Heard - ${accountName}`,
    description,
    path: `/account/${accountId}/workouts/sources`,
    icon: iconUrl,
    index: false,
  });
}

export default function WorkoutSourcesPage() {
  return <WorkoutSourcesClientWrapper />;
}
