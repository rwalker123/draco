'use client';

import ProtectedRoute from '../../components/auth/ProtectedRoute';
import AdminDashboard from './AdminDashboard';

export default function AdminDashboardClientWrapper() {
  return (
    <ProtectedRoute requiredRole="Administrator" checkAccountBoundary={false}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
