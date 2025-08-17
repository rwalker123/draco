'use client';

import { useParams } from 'next/navigation';
import PlayerClassifieds from './PlayerClassifieds';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';

export default function PlayerClassifiedsClientWrapper() {
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  if (!accountIdStr) {
    return <div>Account ID not found</div>;
  }

  return (
    <ProtectedRoute requiredRole="TeamAdmin" checkAccountBoundary={true}>
      <PlayerClassifieds accountId={accountIdStr} />
    </ProtectedRoute>
  );
}
