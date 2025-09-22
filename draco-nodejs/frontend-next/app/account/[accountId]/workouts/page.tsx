import { getAccountBranding } from '../../../../lib/metadataFetchers';
import WorkoutsClientWrapper from './WorkoutsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Workouts`,
    description: `Manage workouts for ${accountName}`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function WorkoutsPage() {
  return <WorkoutsClientWrapper />;
}
