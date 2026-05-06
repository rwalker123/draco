'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import AccountTypeGuard from '../../../../../../../../../components/auth/AccountTypeGuard';
import TeamPhotoGalleryAdmin from './TeamPhotoGalleryAdmin';

export default function TeamPhotoGalleryAdminClient() {
  const params = useParams();
  const accountId = Array.isArray(params?.accountId) ? params?.accountId[0] : params?.accountId;
  const seasonId = Array.isArray(params?.seasonId) ? params?.seasonId[0] : params?.seasonId;
  const teamSeasonId = Array.isArray(params?.teamSeasonId)
    ? params?.teamSeasonId[0]
    : params?.teamSeasonId;

  if (!accountId || !seasonId || !teamSeasonId) {
    return <div>Invalid route parameters</div>;
  }

  return (
    <AccountTypeGuard requiredAccountType="baseball">
      <ProtectedRoute
        requiredRole={['AccountAdmin', 'AccountPhotoAdmin', 'TeamAdmin', 'TeamPhotoAdmin']}
        checkAccountBoundary={true}
      >
        <TeamPhotoGalleryAdmin
          accountId={accountId}
          seasonId={seasonId}
          teamSeasonId={teamSeasonId}
        />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
