import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import NewWorkoutClientWrapper from './NewWorkoutClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `New Workout - ${accountName}`,
    description: `Create a new workout for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function NewWorkoutPage() {
  return <NewWorkoutClientWrapper />;
}
