'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../components/auth/AccountTypeGuard';
import { PhotoGalleryAdminManagement } from '../../../../../components/photo-gallery/admin/PhotoGalleryAdminManagement';

export default function PhotoGalleryAdminClientWrapper() {
  const params = useParams();
  const accountIdParam = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const accountId = accountIdParam ?? '';

  if (!accountId) {
    return <div>Account ID not found</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute
        requiredRole={['AccountAdmin', 'AccountPhotoAdmin']}
        checkAccountBoundary={true}
      >
        <PhotoGalleryAdminManagement accountId={accountId} />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
