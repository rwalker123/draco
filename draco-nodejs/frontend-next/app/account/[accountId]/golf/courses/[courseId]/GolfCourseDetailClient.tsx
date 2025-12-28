'use client';

import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';
import GolfCourseDetailPage from './GolfCourseDetailPage';

export default function GolfCourseDetailClient() {
  return (
    <ProtectedRoute checkAccountBoundary>
      <GolfCourseDetailPage />
    </ProtectedRoute>
  );
}
