'use client';

import { useParams } from 'next/navigation';
import VerifyClassified from './VerifyClassified';

export default function VerifyClassifiedClientWrapper() {
  const { accountId, id } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const classifiedIdStr = Array.isArray(id) ? id[0] : id;

  if (!accountIdStr || !classifiedIdStr) {
    return <div>Missing required parameters</div>;
  }

  return <VerifyClassified accountId={accountIdStr} classifiedId={classifiedIdStr} />;
}
