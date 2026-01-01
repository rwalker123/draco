'use client';

import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import GolfCoursesPage from './GolfCoursesPage';

export default function GolfCoursesClient() {
  return (
    <AccountTypeGuard requiredAccountType="golf">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
        <GolfCoursesPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
