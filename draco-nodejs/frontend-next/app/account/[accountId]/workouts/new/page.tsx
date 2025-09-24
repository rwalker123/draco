import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import NewWorkoutClientWrapper from './NewWorkoutClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Create a new workout program for ${accountName} to share with coaches and athletes.`;
  return buildSeoMetadata({
    title: `New Workout - ${accountName}`,
    description,
    path: `/account/${accountId}/workouts/new`,
    icon: iconUrl,
    index: false,
  });
}

export default function NewWorkoutPage() {
  return <NewWorkoutClientWrapper />;
}
