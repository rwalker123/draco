import HallOfFamePageClient from './HallOfFamePageClient';
import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import AccountOptional from '@/components/account/AccountOptional';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Explore Hall of Fame inductees and celebrate the legacy of ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Hall of Fame`,
    description,
    path: `/account/${accountId}/hall-of-fame`,
    icon: iconUrl,
    index: false,
  });
}

export default async function HallOfFamePage({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);

  return (
    <AccountOptional accountId={accountId} componentId="account.hallOfFame.page">
      <HallOfFamePageClient accountId={accountId} />
    </AccountOptional>
  );
}
