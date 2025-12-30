'use client';

import ProtectedRoute from '../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../components/auth/AccountTypeGuard';
import GolfCourseDetailPage from './GolfCourseDetailPage';

export default function GolfCourseDetailClient() {
  return (
    <AccountTypeGuard requiredAccountType="golf">
      <ProtectedRoute checkAccountBoundary>
        <GolfCourseDetailPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
