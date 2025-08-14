import { getAccountName } from '../../../../../lib/metadataFetchers';
import NewWorkoutClientWrapper from './NewWorkoutClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `New Workout - ${accountName}`,
    description: `Create a new workout for ${accountName}`,
  };
}

export default function NewWorkoutPage() {
  return <NewWorkoutClientWrapper />;
}
