import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import TemplatesClientWrapper from './TemplatesClientWrapper';

// Dynamically set the page title to "{Account Name} Email Templates"
export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Organize reusable messaging templates for ${accountName} to accelerate season updates and announcements.`;
  return buildSeoMetadata({
    title: `${accountName} Email Templates`,
    description,
    path: `/account/${accountId}/communications/templates`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <TemplatesClientWrapper />;
}
