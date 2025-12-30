'use client';

import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../../components/auth/AccountTypeGuard';
import GolfFlightManagement from './GolfFlightManagement';

export default function GolfFlightManagementClientWrapper() {
  const params = useParams();
  const router = useRouter();

  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const seasonId = Array.isArray(params.seasonId) ? params.seasonId[0] : params.seasonId;

  const accountIdStr = accountId ?? '';
  const seasonIdStr = seasonId ?? '';

  const handleClose = () => {
    router.push(`/account/${accountIdStr}/seasons`);
  };

  return (
    <AccountTypeGuard requiredAccountType="golf">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <GolfFlightManagement
          accountId={accountIdStr}
          seasonId={seasonIdStr}
          onClose={handleClose}
        />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
