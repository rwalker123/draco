'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SocialMediaManagement from './SocialMediaManagement';

export default function SocialMediaManagementClientWrapper() {
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <SocialMediaManagement />
    </ProtectedRoute>
  );
}
