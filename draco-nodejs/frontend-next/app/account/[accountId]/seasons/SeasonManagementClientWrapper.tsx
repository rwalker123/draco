'use client';

import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { useAccount } from '../../../../context/AccountContext';
import BaseballSeasonManagement from './BaseballSeasonManagement';
import GolfSeasonManagement from './GolfSeasonManagement';

export default function SeasonManagementClientWrapper() {
  const { currentAccount, loading, initialized } = useAccount();

  if (!initialized || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const accountType = currentAccount?.accountType?.toLowerCase() ?? '';
  const isGolf = accountType.includes('golf');

  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      {isGolf ? <GolfSeasonManagement /> : <BaseballSeasonManagement />}
    </ProtectedRoute>
  );
}
