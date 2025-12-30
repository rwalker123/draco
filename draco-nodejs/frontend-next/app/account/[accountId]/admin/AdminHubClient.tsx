'use client';

import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { useAccount } from '../../../../context/AccountContext';
import BaseballAdminHubPage from './BaseballAdminHubPage';
import GolfAdminHubPage from './GolfAdminHubPage';

export default function AdminHubClient() {
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
    <ProtectedRoute requiredRole={['AccountAdmin']} checkAccountBoundary>
      {isGolf ? <GolfAdminHubPage /> : <BaseballAdminHubPage />}
    </ProtectedRoute>
  );
}
