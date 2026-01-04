'use client';

import { Box, CircularProgress } from '@mui/material';
import { useAccount } from '../../../context/AccountContext';
import BaseballAccountHome from './BaseballAccountHome';
import GolfLeagueAccountHome from './GolfLeagueAccountHome';
import IndividualGolfAccountHome from './IndividualGolfAccountHome';
import {
  isGolfIndividualAccountType,
  isGolfLeagueAccountType,
} from '../../../utils/accountTypeUtils';

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

  const accountType = currentAccount?.accountType;

  if (isGolfIndividualAccountType(accountType)) {
    return <IndividualGolfAccountHome />;
  }

  if (isGolfLeagueAccountType(accountType)) {
    return <GolfLeagueAccountHome />;
  }

  return <BaseballAccountHome />;
}
