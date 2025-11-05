import AccountPageClientWrapper from './AccountPageClientWrapper';
import { getAccountBranding } from '../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../lib/metadataParams';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Learn more about ${accountName} on ${DEFAULT_SITE_NAME}, including schedules, rosters, workouts, and player development resources.`;
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
