'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminAlerts from './AdminAlerts';

export default function AdminAlertsClientWrapper() {
  return (
    <ProtectedRoute requiredRole="Administrator" checkAccountBoundary={false}>
      <AdminAlerts />
    </ProtectedRoute>
  );
}
