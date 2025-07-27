'use client';

import { useParams } from 'next/navigation';
import UserManagement from './UserManagement';

export default function UserManagementClientWrapper() {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  if (!accountIdStr) {
    return <div>Account ID not found</div>;
  }

  return <UserManagement accountId={accountIdStr} />;
}
