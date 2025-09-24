import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import EditWorkoutClientWrapper from './EditWorkoutClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; workoutId: string }>;
}) {
  const { accountId, workoutId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Update workout ${workoutId} to refine training plans for ${accountName} athletes.`;
  return buildSeoMetadata({
    title: `Edit Workout - ${accountName}`,
    description,
    path: `/account/${accountId}/workouts/${workoutId}/edit`,
    icon: iconUrl,
    index: false,
  });
}

export default function EditWorkoutPage() {
  return <EditWorkoutClientWrapper />;
}
