import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import AccountAnnouncementsClient from './AccountAnnouncementsClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Read announcements shared with members of ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Announcements`,
    description,
    path: `/account/${accountId}/announcements`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountAnnouncementsClient />;
}
