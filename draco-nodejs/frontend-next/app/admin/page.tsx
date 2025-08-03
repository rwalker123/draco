'use client';
import AdminDashboard from './AdminDashboard';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requiredRole="Administrator" checkAccountBoundary={false}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
