import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import WorkoutDetailsClientWrapper from './WorkoutDetailsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; workoutId: string }>;
}) {
  const { accountId, workoutId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `View workout details and registration options for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Workout`,
    description,
    path: `/account/${accountId}/workouts/${workoutId}`,
    icon: iconUrl,
    index: false,
  });
}

export default function WorkoutDetailsPage() {
  return <WorkoutDetailsClientWrapper />;
}

