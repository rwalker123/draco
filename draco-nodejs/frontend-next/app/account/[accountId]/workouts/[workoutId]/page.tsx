import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import WorkoutDetailsClientWrapper from './WorkoutDetailsClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string; workoutId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `Preview Workout - ${accountName}`,
    description: `Preview how this workout will appear on the home page for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function WorkoutDetailsPage() {
  return <WorkoutDetailsClientWrapper />;
}
