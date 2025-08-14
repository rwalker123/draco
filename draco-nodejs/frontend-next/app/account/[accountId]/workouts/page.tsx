import { getAccountName } from '../../../../lib/metadataFetchers';
import WorkoutsClientWrapper from './WorkoutsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const accountName = await getAccountName(accountId);
  return {
    title: `${accountName} Workouts`,
    description: `Manage workouts for ${accountName}`,
  };
}

export default function WorkoutsPage() {
  return <WorkoutsClientWrapper />;
}
