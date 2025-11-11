'use client';

import { useParams } from 'next/navigation';
import SocialHubContainer from '../../../../components/social/SocialHubContainer';

export default function SocialHubClientWrapper() {
  const params = useParams();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  return <SocialHubContainer accountId={accountId ?? ''} />;
}
