import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import WorkoutDetailsClientWrapper from './WorkoutDetailsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; workoutId: string }>;
}) {
  const { accountId, workoutId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Preview how this workout will appear on the ${accountName} home page before publishing.`;
  return buildSeoMetadata({
    title: `Preview Workout - ${accountName}`,
    description,
    path: `/account/${accountId}/workouts/${workoutId}`,
    icon: iconUrl,
    index: false,
  });
}

export default function WorkoutDetailsPage() {
  return <WorkoutDetailsClientWrapper />;
}
