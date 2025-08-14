import { getAccountName } from '../../../../../lib/metadataFetchers';
import WorkoutSourcesClientWrapper from './WorkoutSourcesClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `Workout Where Heard - ${accountName}`,
    description: `Manage where-heard options for workouts at ${accountName}`,
  };
}

export default function WorkoutSourcesPage() {
  return <WorkoutSourcesClientWrapper />;
}
