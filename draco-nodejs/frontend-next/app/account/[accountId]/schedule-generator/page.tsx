import { getAccountBranding } from '@/lib/metadataFetchers';
import { buildSeoMetadata, DEFAULT_SITE_NAME } from '@/lib/seoMetadata';
import { resolveRouteParams, type MetadataParams } from '@/lib/metadataParams';
import ScheduleGeneratorClientWrapper from './ScheduleGeneratorClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  const description = `Generate round-robin schedules for ${accountName} with ${DEFAULT_SITE_NAME}.`;
  return buildSeoMetadata({
    title: `${accountName} Schedule Generator`,
    description,
    path: `/account/${accountId}/schedule-generator`,
    icon: iconUrl,
    index: false,
  });
}

export default function Page() {
  return <ScheduleGeneratorClientWrapper />;
}
