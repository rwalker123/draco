'use client';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import Communications from './Communications';

export default function CommunicationsClientWrapper() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <Communications />
    </ProtectedRoute>
  );
}
