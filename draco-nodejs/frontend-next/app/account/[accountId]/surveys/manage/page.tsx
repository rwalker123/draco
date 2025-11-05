import { getAccountBranding } from '../../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../../lib/metadataParams';
import SurveyManagementClientWrapper from './SurveyManagementClientWrapper';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Player Survey Management`,
    description: `Manage player survey questions and responses for ${accountName}.`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function SurveyManagementPage() {
  return <SurveyManagementClientWrapper />;
}
