import React, { useState, useEffect } from 'react';
import { Box, Button, Alert, Container } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import BaseballAccountHome from '../BaseballAccountHome';
import GolfLeagueAccountHome from '../GolfLeagueAccountHome';
import IndividualGolfAccountHome from '../IndividualGolfAccountHome';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { AccountType } from '@draco/shared-schemas';
import {
  isGolfIndividualAccountType,
  isGolfLeagueAccountType,
} from '../../../../utils/accountTypeUtils';

const AccountHome: React.FC = () => {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { accountId } = useParams();
  const apiClient = useApiClient();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  useEffect(() => {
    if (!accountIdStr) {
      setAccount(null);
      setError('Account not found or not publicly accessible');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchAccountData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId: accountIdStr },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const accountWithSeasons = unwrapApiResult(
          result,
          'Account not found or not publicly accessible',
        );

        setAccount(accountWithSeasons.account as AccountType);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load account information', err);
        setError('Failed to load account information');
        setAccount(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchAccountData();

    return () => {
      controller.abort();
    };
  }, [accountIdStr, apiClient]);

  if (isLoading) {
    return null;
  }

  if (error || !account) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Account not found'}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => router.push('/accounts')}>
            Back to Accounts
          </Button>
        </Box>
      </Container>
    );
  }

  const accountType = account.configuration?.accountType?.name;

  if (isGolfIndividualAccountType(accountType)) {
    return <IndividualGolfAccountHome />;
  }

  if (isGolfLeagueAccountType(accountType)) {
    return <GolfLeagueAccountHome />;
  }

  return <BaseballAccountHome />;
};

export default AccountHome;
