'use client';

import SocialHubPageContent from '../../../../components/social/SocialHubPageContent';

interface SocialHubClientWrapperProps {
  accountId: string;
}

export default function SocialHubClientWrapper({ accountId }: SocialHubClientWrapperProps) {
  return <SocialHubPageContent accountId={accountId} />;
}
