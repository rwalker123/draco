'use client';

import { useParams } from 'next/navigation';
import LeagueFaqPublicClient from './LeagueFaqPublicClient';

export default function LeagueFaqPublicClientWrapper() {
  const params = useParams();
  const accountIdParam = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const accountId = accountIdParam ?? '';

  if (!accountId) {
    return <div>Account ID not found</div>;
  }

  return <LeagueFaqPublicClient accountId={accountId} />;
}
