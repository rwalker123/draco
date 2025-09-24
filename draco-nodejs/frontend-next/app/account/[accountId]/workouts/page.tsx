import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import WorkoutsClientWrapper from './WorkoutsClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Design and publish skill development workouts tailored for ${accountName} athletes.`;
  return buildSeoMetadata({
    title: `${accountName} Workouts`,
    description,
    path: `/account/${accountId}/workouts`,
    icon: iconUrl,
    index: false,
  });
}

export default function WorkoutsPage() {
  return <WorkoutsClientWrapper />;
}
