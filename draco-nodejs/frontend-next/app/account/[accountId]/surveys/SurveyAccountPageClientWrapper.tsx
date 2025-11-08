'use client';

import SurveyAccountPage from './SurveyAccountPage';

interface SurveyAccountPageClientWrapperProps {
  accountId: string;
}

export default function SurveyAccountPageClientWrapper({
  accountId,
}: SurveyAccountPageClientWrapperProps) {
  return <SurveyAccountPage accountId={accountId} />;
}
