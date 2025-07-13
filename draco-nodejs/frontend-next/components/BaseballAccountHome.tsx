import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Container,
  Chip,
} from '@mui/material';
import {
  Group as GroupIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import BaseballScoreboard from './BaseballScoreboard';
import GameRecapsWidget from './GameRecapsWidget';
import TeamAvatar from './TeamAvatar';

interface Account {
  id: string;
  name: string;
  accountType: string;
  accountTypeId: string;
  firstYear: number;
  affiliation?: string;
  timezoneId: string;
  twitterAccountName?: string;
  facebookFanPage?: string;
  urls: Array<{ id: string; url: string }>;
}

interface Season {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface UserTeam {
  id: string;
  name: string;
  leagueName: string;
  divisionName?: string;
  record?: string;
  standing?: number;
  nextGame?: {
    date: string;
    opponent: string;
    location: string;
  };
  logoUrl?: string;
  teamId?: string; // Added teamId to the interface
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ mr: 3 }}>
              <TeamAvatar name={account.name} size={80} alt={account.name} />
            </Box>
            <Box>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {account.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Chip
                  label={account.accountType}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
                {account.affiliation && (
                  <Chip
                    label={account.affiliation}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                    icon={<GroupIcon sx={{ color: 'white' }} />}
                  />
                )}
              </Box>
              <Typography
                variant="body1"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                <LocationIcon fontSize="small" />
                {currentSeason ? `Current Season: ${currentSeason.name}` : 'No Current Season'} •
                Established {account.firstYear}
              </Typography>
            </Box>
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
              <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{
                    fontWeight: 'bold',
                    color: '#1e3a8a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3,
                  }}
                >
                  <StarIcon sx={{ color: '#fbbf24' }} />
                  My Teams
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    gap: 3,
                  }}
                >
                  {userTeams.map((team) => (
                    <Card
                      key={team.teamId || team.id}
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                          borderColor: '#1e3a8a',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <TeamAvatar
                            name={team.name}
                            logoUrl={team.logoUrl}
                            size={48}
                            alt={team.name + ' logo'}
                          />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                              {team.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {team.leagueName}
                            </Typography>
                          </Box>
                        </Box>
                        {team.record && (
                          <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
                            <strong>Record:</strong> {team.record}
                          </Typography>
                        )}
                        {team.standing && (
                          <Typography variant="body2" sx={{ mb: 1, color: '#374151' }}>
                            <strong>Standing:</strong> {team.standing}
                          </Typography>
                        )}
                        {team.nextGame && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 2,
                              bgcolor: '#f9fafb',
                              borderRadius: 1,
                              border: '1px solid #e5e7eb',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 'bold', mb: 1, color: '#1e3a8a' }}
                            >
                              Next Game
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              vs {team.nextGame.opponent}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(team.nextGame.date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {team.nextGame.location}
                            </Typography>
                          </Box>
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewTeam(team.id)}
                          sx={{
                            mt: 2,
                            borderColor: '#1e3a8a',
                            color: '#1e3a8a',
                            '&:hover': {
                              bgcolor: '#1e3a8a',
                              color: 'white',
                            },
                          }}
                        >
                          View Team
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>
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
