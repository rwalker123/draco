import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import EditWorkoutClientWrapper from './EditWorkoutClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; workoutId: string }>;
}) {
  const { accountId, workoutId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `Edit Workout - ${accountName}`,
    description: `Edit workout ${workoutId} for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function EditWorkoutPage() {
  return <EditWorkoutClientWrapper />;
}
