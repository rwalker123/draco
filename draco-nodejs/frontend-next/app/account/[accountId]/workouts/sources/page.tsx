import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import WorkoutSourcesClientWrapper from './WorkoutSourcesClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `Workout Where Heard - ${accountName}`,
    description: `Manage where-heard options for workouts at ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function WorkoutSourcesPage() {
  return <WorkoutSourcesClientWrapper />;
}
