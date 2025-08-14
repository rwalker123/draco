import { getAccountName } from '../../../../../lib/metadataFetchers';
import WorkoutDetailsClientWrapper from './WorkoutDetailsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; workoutId: string }>;
}) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `Preview Workout - ${accountName}`,
    description: `Preview how this workout will appear on the home page for ${accountName}`,
  };
}

export default function WorkoutDetailsPage() {
  return <WorkoutDetailsClientWrapper />;
}
