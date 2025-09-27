import AccountPageClientWrapper from './AccountPageClientWrapper';
import { getAccountBranding } from '../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../lib/seoMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Learn more about ${accountName} on Draco Sports Manager, including schedules, rosters, workouts, and player development resources.`;
  return buildSeoMetadata({
    title: `${accountName} Programs`,
    description,
    path: `/account/${accountId}`,
    icon: iconUrl,
  });
}

export default function AccountPage() {
  return <AccountPageClientWrapper />;
}
