import { getAccountBranding } from '../../../../lib/metadataFetchers';
import { resolveRouteParams, type MetadataParams } from '../../../../lib/metadataParams';
import SurveyAccountPageClientWrapper from './SurveyAccountPageClientWrapper';
import AccountOptional from '@/components/account/AccountOptional';

export async function generateMetadata({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Player Surveys`,
    description: `View player survey responses for ${accountName}.`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default async function AccountSurveysPage({
  params,
}: {
  params: MetadataParams<{ accountId: string }>;
}) {
  const { accountId } = await resolveRouteParams(params);

  return (
    <AccountOptional accountId={accountId} componentId="account.playerSurvey.page">
      <SurveyAccountPageClientWrapper accountId={accountId} />
    </AccountOptional>
  );
}
