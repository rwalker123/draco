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
  Avatar
} from '@mui/material';
import { 
  CalendarMonth, 
  Group, 
  Visibility as ViewIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  SportsBaseball as BaseballIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as StatsIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import BaseballScoreboard from './BaseballScoreboard';

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
}

interface League {
  id: string;
  name: string;
  teamCount: number;
}

interface RecentGame {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'completed' | 'scheduled' | 'in_progress';
}

const BaseballAccountHome: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
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
        const accountResponse = await fetch(`/api/accounts/${accountIdStr}/public`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          if (accountData.success) {
            setAccount(accountData.data.account);
            setSeasons(accountData.data.seasons || []);
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
                'Authorization': `Bearer ${token}`
              },
            });

            if (teamsResponse.ok) {
              const teamsData = await teamsResponse.json();
              if (teamsData.success) {
                setUserTeams(teamsData.data.teams || []);
              }
            }
          } catch (err) {
            console.warn('Failed to fetch user teams:', err);
          }
        }

        // Fetch leagues
        try {
          const leaguesResponse = await fetch(`/api/accounts/${accountIdStr}/leagues`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (leaguesResponse.ok) {
            const leaguesData = await leaguesResponse.json();
            if (leaguesData.success) {
              setLeagues(leaguesData.data.leagues || []);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch leagues:', err);
        }

        // Fetch recent games
        try {
          const gamesResponse = await fetch(`/api/accounts/${accountIdStr}/recent-games`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (gamesResponse.ok) {
            const gamesData = await gamesResponse.json();
            if (gamesData.success) {
              setRecentGames(gamesData.data.games || []);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch recent games:', err);
        }

      } catch {
        setError('Account not found or not publicly accessible');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountIdStr, user, token]);

  const handleViewSeasons = () => {
    if (user) {
      router.push(`/account/${accountIdStr}/seasons`);
    } else {
      router.push('/login?from=' + encodeURIComponent(getCurrentPath()));
    }
  };

  const handleManageAccount = () => {
    if (user) {
      router.push(`/account/${accountIdStr}/management`);
    } else {
      router.push('/login?from=' + encodeURIComponent(getCurrentPath()));
    }
  };

  const handleAccountSettings = () => {
    if (user) {
      router.push(`/account/${accountIdStr}/settings`);
    } else {
      router.push('/login?from=' + encodeURIComponent(getCurrentPath()));
    }
  };

  const handleViewTeam = (teamId: string) => {
    router.push(`/account/${accountIdStr}/team/${teamId}`);
  };

  const handleViewStandings = () => {
    router.push(`/account/${accountIdStr}/standings`);
  };

  const handleViewSchedule = () => {
    router.push(`/account/${accountIdStr}/schedule`);
  };

  const handleViewStats = () => {
    router.push(`/account/${accountIdStr}/statistics`);
  };

  // Helper to get current path safely
  const getCurrentPath = () => (typeof window !== 'undefined' ? window.location.pathname : '/');

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
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
        <Button
          variant="outlined"
          onClick={() => router.push('/accounts')}
          startIcon={<BaseballIcon />}
        >
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
        <Button
          variant="outlined"
          onClick={() => router.push('/accounts')}
          startIcon={<BaseballIcon />}
        >
          Back to Accounts
        </Button>
      </Container>
    );
  }

  const currentSeason = seasons.find(s => s.isCurrent);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#f8f9fa',
      py: 3
    }}>
      <Container maxWidth="xl">
        {/* Hero Section - Full Width */}
        <Paper sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          color: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'rgba(255,255,255,0.2)',
              mr: 3,
              border: '2px solid rgba(255,255,255,0.3)'
            }}>
              <BaseballIcon sx={{ fontSize: 40, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ 
                fontWeight: 'bold',
                color: 'white'
              }}>
                {account.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Chip 
                  label={account.accountType} 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                  icon={<BaseballIcon sx={{ color: 'white' }} />}
                />
                {account.affiliation && (
                  <Chip 
                    label={account.affiliation} 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.1)', 
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    icon={<Group sx={{ color: 'white' }} />}
                  />
                )}
              </Box>
              <Typography variant="body1" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: 'rgba(255,255,255,0.9)'
              }}>
                <LocationIcon fontSize="small" />
                {account.timezoneId} • Established {account.firstYear}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ScheduleIcon />}
              onClick={handleViewSchedule}
              sx={{ 
                bgcolor: 'white',
                color: '#1e3a8a',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)'
                },
                px: 3,
                py: 1.5,
                fontWeight: 'bold'
              }}
            >
              View Schedule
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<StatsIcon />}
              onClick={handleViewStats}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                },
                px: 3,
                py: 1.5,
                fontWeight: 'bold'
              }}
            >
              Statistics
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<TrophyIcon />}
              onClick={handleViewStandings}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                },
                px: 3,
                py: 1.5,
                fontWeight: 'bold'
              }}
            >
              Standings
            </Button>
            {user && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleManageAccount}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Manage League
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={handleAccountSettings}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Settings
                </Button>
              </>
            )}
            {!user && (
              <Button
                variant="contained"
                onClick={() => router.push('/login?from=' + encodeURIComponent(getCurrentPath()))}
                sx={{ 
                  bgcolor: 'white',
                  color: '#1e3a8a',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)'
                  }
                }}
              >
                Sign In to Manage
              </Button>
            )}
          </Box>
        </Paper>

        {/* Main Content Grid - Progressive Layout */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            lg: '1fr 400px' 
          },
          gap: 4,
          alignItems: 'start'
        }}>
          {/* Left Column - Main Content */}
          <Box>
            {/* User Teams Section */}
            {user && userTeams.length > 0 && (
              <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Typography variant="h5" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: '#1e3a8a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 3
                }}>
                  <PersonIcon />
                  My Teams
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 3 
                }}>
                  {userTeams.map((team) => (
                    <Card key={team.id} sx={{ 
                      height: '100%',
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                        borderColor: '#1e3a8a'
                      }
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: '#1e3a8a',
                            mr: 2,
                            width: 48,
                            height: 48
                          }}>
                            <BaseballIcon />
                          </Avatar>
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
                          <Box sx={{ 
                            mt: 2, 
                            p: 2, 
                            bgcolor: '#f9fafb', 
                            borderRadius: 1,
                            border: '1px solid #e5e7eb'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#1e3a8a' }}>
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
                              color: 'white'
                            }
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

            {/* Current Season Info */}
            {currentSeason && (
              <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Typography variant="h5" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: '#1e3a8a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2
                }}>
                  <CalendarMonth />
                  Current Season
                </Typography>
                <Typography variant="h4" color="#1e3a8a" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {currentSeason.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  The {currentSeason.name} season is in full swing! Check out the latest schedules, standings, and statistics.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<ViewIcon />}
                    onClick={handleViewSeasons}
                    sx={{ 
                      bgcolor: '#1e3a8a',
                      '&:hover': { bgcolor: '#1e40af' }
                    }}
                  >
                    Season Details
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ScheduleIcon />}
                    onClick={handleViewSchedule}
                    sx={{ 
                      borderColor: '#1e3a8a',
                      color: '#1e3a8a',
                      '&:hover': {
                        bgcolor: '#1e3a8a',
                        color: 'white'
                      }
                    }}
                  >
                    Full Schedule
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Quick Stats */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 3,
              mb: 4 
            }}>
              <Card sx={{ 
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                bgcolor: 'white'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1e3a8a' }}>
                    {leagues.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Leagues
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ 
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                bgcolor: 'white'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1e3a8a' }}>
                    {leagues.reduce((total, league) => total + league.teamCount, 0)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Teams
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ 
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                bgcolor: 'white'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1e3a8a' }}>
                    {seasons.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Seasons
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ 
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                bgcolor: 'white'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1e3a8a' }}>
                    {new Date().getFullYear() - account.firstYear + 1}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Years Active
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <Typography variant="h5" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: '#1e3a8a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 3
                }}>
                  <ScheduleIcon />
                  Recent Games
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  gap: 2 
                }}>
                  {recentGames.slice(0, 6).map((game) => (
                    <Card key={game.id} sx={{ 
                      borderRadius: 2,
                      border: game.status === 'completed' ? '2px solid #10b981' : 
                              game.status === 'in_progress' ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                      bgcolor: 'white'
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(game.date).toLocaleDateString()}
                          </Typography>
                          <Chip 
                            label={game.status?.replace('_', ' ') || game.status || 'Unknown'} 
                            size="small"
                            sx={{
                              bgcolor: game.status === 'completed' ? '#10b981' : 
                                       game.status === 'in_progress' ? '#f59e0b' : '#6b7280',
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                            {game.homeTeam} {game.homeScore} - {game.awayScore} {game.awayTeam}
                          </Typography>
                        </Box>
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
                      '&:hover': { bgcolor: '#1e40af' }
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
                        color: 'white'
                      }
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
                        color: 'white'
                      }
                    }}
                  >
                    Facebook
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Right Column - Scoreboard */}
          <Box sx={{ 
            position: { lg: 'sticky' },
            top: { lg: 24 },
            height: 'fit-content'
          }}>
            <BaseballScoreboard 
              accountId={accountIdStr!} 
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default BaseballAccountHome; 