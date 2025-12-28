'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import GolfCoursesPage from './GolfCoursesPage';

export default function GolfCoursesClient() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
      <GolfCoursesPage />
    </ProtectedRoute>
  );
}
