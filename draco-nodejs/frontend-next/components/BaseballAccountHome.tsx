import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Container,
  Chip,
} from '@mui/material';
import { Group as GroupIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import BaseballScoreboard from './BaseballScoreboard';
import GameRecapsWidget from './GameRecapsWidget';
import MyTeams, { UserTeam } from './MyTeams';
import AccountLogoHeader from './AccountLogoHeader';

interface Account {
  id: string;
  name: string;
  accountType: string;
  accountTypeId: string;
  firstYear: number;
  affiliation?: { name: string; url: string } | null;
  timezoneId: string;
  twitterAccountName?: string;
  facebookFanPage?: string;
  urls: Array<{ id: string; url: string }>;
  accountLogoUrl?: string; // Added for AccountLogoHeader
}

interface Season {
  id: string;
  name: string;
  isCurrent: boolean;
}

const BaseballAccountHome: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const router = useRouter();
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  useEffect(() => {
    if (!accountIdStr) return;

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch account data
        const accountResponse = await fetch(
          `/api/accounts/${accountIdStr}/public?currentSeasonOnly=true`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          if (accountData.success) {
            setAccount(accountData.data.account);
            setCurrentSeason(accountData.data.currentSeason || null);
          } else {
            setError(accountData.message || 'Account not found or not publicly accessible');
          }
        } else {
          setError('Account not found or not publicly accessible');
        }

        // Fetch user teams if logged in
        if (user) {
          try {
            const teamsResponse = await fetch(`/api/accounts/${accountIdStr}/user-teams`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });

            if (teamsResponse.ok) {
              const teamsData = await teamsResponse.json();
              if (teamsData.success) {
                setUserTeams(teamsData.data.teams || []);
                console.log('userTeams:', teamsData.data.teams);
              }
            }
          } catch (err) {
            console.warn('Failed to fetch user teams:', err);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountIdStr, user, token]);

  const handleViewTeam = (teamSeasonId: string) => {
    if (!currentSeason) return;
    router.push(`/account/${accountIdStr}/seasons/${currentSeason.id}/teams/${teamSeasonId}`);
  };

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
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f8f9fa',
        py: 3,
      }}
    >
      <Container maxWidth="xl">
        {/* Hero Section - Full Width */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            color: 'white',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          {/* Top Centered Account Logo inside the card */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <AccountLogoHeader
              accountId={account.id}
              accountLogoUrl={account.accountLogoUrl}
              style={{ background: 'transparent', borderBottom: 0 }}
            />
          </Box>
          <Box>
            {/* Only show account name if no logo is present (AccountLogoHeader will show 'No Logo' if missing) */}
            {!account.accountLogoUrl && (
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                {account.name}
              </Typography>
            )}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                mb: 1,
                justifyContent: 'center',
              }}
            >
              {account.affiliation &&
                account.affiliation.name &&
                (account.affiliation.url ? (
                  <Chip
                    label={account.affiliation.name}
                    component="a"
                    href={account.affiliation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      textDecoration: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                        textDecoration: 'underline',
                      },
                    }}
                    icon={<GroupIcon sx={{ color: 'white' }} />}
                  />
                ) : (
                  <Chip
                    label={account.affiliation.name}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                    icon={<GroupIcon sx={{ color: 'white' }} />}
                  />
                ))}
            </Box>
            <Typography
              variant="body1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'rgba(255,255,255,0.9)',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <LocationIcon fontSize="small" />
              {currentSeason ? `${currentSeason.name} Season` : 'No Current Season'} • Established{' '}
              {account.firstYear}
            </Typography>
          </Box>
        </Paper>

        {/* Main Content Grid - Progressive Layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: '1fr 400px',
            },
            gap: 4,
            alignItems: 'start',
          }}
        >
          {/* Left Column - Main Content */}
          <Box>
            {/* Game Recaps Widget - show as first content */}
            {currentSeason && (
              <GameRecapsWidget accountId={accountIdStr!} seasonId={currentSeason.id} />
            )}
            {/* User Teams Section */}
            {user && userTeams.length > 0 && (
              <MyTeams userTeams={userTeams} onViewTeam={handleViewTeam} />
            )}

            {/* Contact & Links */}
            <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                Connect With Us
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {account.urls.length > 0 && (
                  <Button
                    variant="contained"
                    href={account.urls[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      bgcolor: '#1e3a8a',
                      '&:hover': { bgcolor: '#1e40af' },
                    }}
                  >
                    Visit Website
                  </Button>
                )}
                {account.twitterAccountName && (
                  <Button
                    variant="outlined"
                    href={`https://twitter.com/${account.twitterAccountName?.replace('@', '') || account.twitterAccountName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderColor: '#1e3a8a',
                      color: '#1e3a8a',
                      '&:hover': {
                        bgcolor: '#1e3a8a',
                        color: 'white',
                      },
                    }}
                  >
                    Twitter
                  </Button>
                )}
                {account.facebookFanPage && (
                  <Button
                    variant="outlined"
                    href={account.facebookFanPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderColor: '#1e3a8a',
                      color: '#1e3a8a',
                      '&:hover': {
                        bgcolor: '#1e3a8a',
                        color: 'white',
                      },
                    }}
                  >
                    Facebook
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Right Column - Scoreboard */}
          <Box
            sx={{
              position: { lg: 'sticky' },
              top: { lg: 24 },
              height: 'fit-content',
            }}
          >
            <BaseballScoreboard accountId={accountIdStr!} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default BaseballAccountHome;
