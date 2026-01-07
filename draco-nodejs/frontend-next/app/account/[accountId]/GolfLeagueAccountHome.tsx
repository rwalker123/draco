'use client';

import React, { useState, useEffect } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Chip, Typography } from '@mui/material';
import { Group as GroupIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import AccountPageHeader from '../../../components/AccountPageHeader';
import AdPlacement from '../../../components/ads/AdPlacement';
import OrganizationsWidget from '../../../components/OrganizationsWidget';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { AccountSeasonWithStatusType, AccountType } from '@draco/shared-schemas';
import InformationWidget from '@/components/information/InformationWidget';
import GolfStandings from '@/components/GolfStandings';
import GolfMatchesWidget from '@/components/GolfMatchesWidget';
import GolfHandicapLeaderboard from '@/components/GolfHandicapLeaderboard';

const GolfLeagueAccountHome: React.FC = () => {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [currentSeason, setCurrentSeason] = useState<AccountSeasonWithStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOrganizationsWidget, setShowOrganizationsWidget] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const apiClient = useApiClient();

  useEffect(() => {
    if (!accountIdStr) {
      setAccount(null);
      setCurrentSeason(null);
      setError('Account ID not found');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId: accountIdStr },
          query: { includeCurrentSeason: true },
          throwOnError: false,
        });

        if (!isMounted) {
          return;
        }

        const { account: accountData, currentSeason: responseCurrentSeason } = unwrapApiResult(
          result,
          'Account not found or not publicly accessible',
        );
        setAccount(accountData as AccountType);

        setCurrentSeason(responseCurrentSeason as AccountSeasonWithStatusType | null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to fetch account data:', err);
        setError('Failed to load account data');
        setAccount(null);
        setCurrentSeason(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAccountData();

    return () => {
      isMounted = false;
    };
  }, [accountIdStr, apiClient]);

  if (!accountIdStr) {
    return (
      <Container maxWidth="xl" disableGutters sx={{ py: 4, px: { xs: 1, sm: 1.5 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Account ID not found
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" disableGutters sx={{ py: 4, px: { xs: 1, sm: 1.5 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container maxWidth="xl" disableGutters sx={{ py: 4, px: { xs: 1, sm: 1.5 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Account not found
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Box>
        <AccountPageHeader accountId={account.id} accountLogoUrl={account.accountLogoUrl}>
          {account.configuration?.affiliation &&
            account.configuration.affiliation.name &&
            account.configuration.affiliation.name.trim().toLowerCase() !== 'no affiliation' && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  mb: 1,
                  justifyContent: 'center',
                }}
              >
                {account.configuration.affiliation.url ? (
                  <Chip
                    label={account.configuration.affiliation.name}
                    component="a"
                    href={account.configuration.affiliation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      textDecoration: 'none',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                        textDecoration: 'underline',
                      },
                    }}
                    icon={<GroupIcon />}
                  />
                ) : (
                  <Chip
                    label={account.configuration.affiliation.name}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                    }}
                    icon={<GroupIcon />}
                  />
                )}
              </Box>
            )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: (theme) => theme.palette.text.primary,
                textAlign: 'center',
              }}
            >
              <LocationIcon fontSize="small" />
              {currentSeason ? `${currentSeason.name} Season` : 'No Current Season'} • Established{' '}
              {account.configuration?.firstYear}
            </Typography>
          </Box>
        </AccountPageHeader>
        <AdPlacement />
      </Box>

      <Container maxWidth="xl" disableGutters sx={{ py: 4, px: { xs: 1, sm: 1.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'minmax(0, 2.2fr) minmax(0, 1fr)',
            },
            gap: { xs: 4, lg: 6 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            {currentSeason && accountIdStr && (
              <GolfHandicapLeaderboard
                accountId={accountIdStr}
                seasonId={currentSeason.id}
                title="Handicap Leaderboard"
              />
            )}

            {accountIdStr ? (
              <InformationWidget
                accountId={accountIdStr}
                showAccountMessages
                showTeamMessages={false}
                title="Information Center"
              />
            ) : null}

            {user ? (
              <Box sx={{ display: showOrganizationsWidget ? 'block' : 'none' }}>
                <OrganizationsWidget
                  title="Your Other Organizations"
                  showSearch={false}
                  maxDisplay={3}
                  sx={{ mb: 0 }}
                  excludeAccountId={accountIdStr}
                  onOrganizationsLoaded={(organizations) => {
                    setShowOrganizationsWidget(organizations.length > 0);
                  }}
                />
              </Box>
            ) : null}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            {currentSeason && accountIdStr && (
              <>
                <GolfMatchesWidget
                  accountId={accountIdStr}
                  seasonId={currentSeason.id}
                  title="Matches"
                />
                <GolfStandings
                  accountId={accountIdStr}
                  seasonId={currentSeason.id}
                  title="Standings"
                />
              </>
            )}
          </Box>
        </Box>
      </Container>
    </main>
  );
};

export default GolfLeagueAccountHome;
