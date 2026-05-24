'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import WaiversClient from './WaiversClient';

export default function WaiversClientWrapper() {
  const params = useParams();
  const accountId = Array.isArray(params?.accountId) ? params?.accountId[0] : params?.accountId;

  if (!accountId) {
    return <div>Invalid route parameters</div>;
  }

  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <WaiversClient accountId={accountId} />
    </ProtectedRoute>
  );
}
