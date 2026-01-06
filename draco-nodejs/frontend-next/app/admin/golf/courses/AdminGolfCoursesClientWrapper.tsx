'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminGolfCoursesPage from './AdminGolfCoursesPage';

export default function AdminGolfCoursesClientWrapper() {
  return (
    <ProtectedRoute requiredRole="Administrator" checkAccountBoundary={false}>
      <AdminGolfCoursesPage />
    </ProtectedRoute>
  );
}
