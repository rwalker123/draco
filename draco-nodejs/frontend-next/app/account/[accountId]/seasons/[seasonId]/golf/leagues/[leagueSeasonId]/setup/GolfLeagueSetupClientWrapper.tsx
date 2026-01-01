'use client';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AccountTypeGuard from '../../../../../../../../../components/auth/AccountTypeGuard';
import ProtectedRoute from '../../../../../../../../../components/auth/ProtectedRoute';
import { GolfLeagueSetupPage } from '../../../../../../../../../components/golf/league-setup';

export default function GolfLeagueSetupClientWrapper() {
  return (
    <AccountTypeGuard requiredAccountType="golf">
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <GolfLeagueSetupPage />
        </LocalizationProvider>
      </ProtectedRoute>
    </AccountTypeGuard>
  );
}
