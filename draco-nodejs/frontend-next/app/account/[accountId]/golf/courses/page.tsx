import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import GolfCoursesClient from './GolfCoursesClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Manage golf courses for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Golf Courses`,
    description,
    path: `/account/${accountId}/golf/courses`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <GolfCoursesClient />;
}
