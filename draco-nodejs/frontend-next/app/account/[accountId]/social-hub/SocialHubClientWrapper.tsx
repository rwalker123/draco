'use client';

import SocialHubContainer from '../../../../components/social/SocialHubContainer';

interface SocialHubClientWrapperProps {
  accountId: string;
}

export default function SocialHubClientWrapper({ accountId }: SocialHubClientWrapperProps) {
  return <SocialHubContainer accountId={accountId} />;
}
