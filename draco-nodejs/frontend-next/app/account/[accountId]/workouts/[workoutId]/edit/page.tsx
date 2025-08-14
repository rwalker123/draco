import { getAccountName } from '../../../../../../lib/metadataFetchers';
import EditWorkoutClientWrapper from './EditWorkoutClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; workoutId: string }>;
}) {
  const { accountId, workoutId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `Edit Workout - ${accountName}`,
    description: `Edit workout ${workoutId} for ${accountName}`,
  };
}

export default function EditWorkoutPage() {
  return <EditWorkoutClientWrapper />;
}
