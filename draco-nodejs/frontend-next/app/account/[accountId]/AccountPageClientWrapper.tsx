'use client';

import { Box, CircularProgress } from '@mui/material';
import { useAccount } from '../../../context/AccountContext';
import BaseballAccountHome from './BaseballAccountHome';
import GolfLeagueAccountHome from './GolfLeagueAccountHome';

export default function AccountPageClientWrapper() {
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

  if (accountType.includes('golf')) {
    return <GolfLeagueAccountHome />;
  }

  return <BaseballAccountHome />;
}
