import { getAccountBranding } from '../../../../lib/metadataFetchers';
import SurveyAccountPageClientWrapper from './SurveyAccountPageClientWrapper';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const { name: accountName, iconUrl } = await getAccountBranding(accountId);
  return {
    title: `${accountName} Player Surveys`,
    description: `View player survey responses for ${accountName}.`,
    ...(iconUrl ? { icons: { icon: iconUrl } } : {}),
  };
}

export default function AccountSurveysPage() {
  return <SurveyAccountPageClientWrapper />;
}
