import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import WaiversClientWrapper from './WaiversClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name, iconUrl } = await getAccountBranding(accountId);
  return buildSeoMetadata({
    title: `${name} Player Waivers`,
    description: `Manage submitted waiver status for players across teams in the current season for ${name}.`,
    path: `/account/${accountId}/waivers`,
    icon: iconUrl,
    index: false,
  });
}

export default function PlayerWaiversPage() {
  return <WaiversClientWrapper />;
}
