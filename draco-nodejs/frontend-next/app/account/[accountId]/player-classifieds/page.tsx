import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import PlayerClassifiedsClientWrapper from './PlayerClassifiedsClientWrapper';
import AccountOptional from '@/components/account/AccountOptional';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Browse player needs and opportunities for ${accountName} teams on ${DEFAULT_SITE_NAME} player classifieds.`;
  return buildSeoMetadata({
    title: `${accountName} Player Classifieds`,
    description,
    path: `/account/${accountId}/player-classifieds`,
    icon: iconUrl,
  });
}

export default async function PlayerClassifiedsPage({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);

  return (
    <AccountOptional accountId={accountId} componentId="account.playerClassified.page">
      <PlayerClassifiedsClientWrapper accountId={accountId} />
    </AccountOptional>
  );
}
