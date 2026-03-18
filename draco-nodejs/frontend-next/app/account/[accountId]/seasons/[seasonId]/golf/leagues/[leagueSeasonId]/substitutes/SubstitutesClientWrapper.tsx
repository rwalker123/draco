'use client';

import AccountTypeGuard from '../../../../../../../../../components/auth/AccountTypeGuard';
import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import { LeagueSubstitutesPage } from '../../../../../../../../../components/golf/substitutes/LeagueSubstitutesPage';

export default function SubstitutesClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="golf">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
        <LeagueSubstitutesPage />
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
