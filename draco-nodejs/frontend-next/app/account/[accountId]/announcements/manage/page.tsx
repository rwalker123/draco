import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import AccountAnnouncementsManagementClient from './AccountAnnouncementsManagementClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const title = `${accountName} Announcement Management`;
  const description = `Create and manage announcements for ${accountName}.`;

  return buildSeoMetadata({
    title,
    description,
    path: `/account/${accountId}/announcements/manage`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <AccountAnnouncementsManagementClient />;
}
