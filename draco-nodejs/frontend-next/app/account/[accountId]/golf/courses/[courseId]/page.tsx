import { getAccountBranding } from '../../../../../../lib/metadataFetchers';
import { buildSeoMetadata } from '../../../../../../lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '../../../../../../lib/metadataParams';
import GolfCourseDetailClient from './GolfCourseDetailClient';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string; courseId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `View golf course details for ${accountName}.`;

  return buildSeoMetadata({
    title: `${accountName} Course Details`,
    description,
    path: `/account/${accountId}/golf/courses`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <GolfCourseDetailClient />;
}
