'use client';

import { useParams } from 'next/navigation';
import SurveyAccountPage from './SurveyAccountPage';

export default function SurveyAccountPageClientWrapper() {
  const params = useParams();
  const accountParam = params?.accountId;
  const accountId = Array.isArray(accountParam)
    ? accountParam[0]
    : (accountParam as string | undefined);

  if (!accountId) {
    return <div>Account ID is required.</div>;
  }

  return <SurveyAccountPage accountId={accountId} />;
}
