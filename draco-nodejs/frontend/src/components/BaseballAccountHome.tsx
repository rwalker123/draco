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
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { accountId } = useParams();

  useEffect(() => {
    if (!accountId) return;

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch account data
        const accountResponse = await fetch(`/api/accounts/${accountId}/public`, {
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
            const teamsResponse = await fetch(`/api/accounts/${accountId}/user-teams`, {
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
          const leaguesResponse = await fetch(`/api/accounts/${accountId}/leagues`, {
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
          const gamesResponse = await fetch(`/api/accounts/${accountId}/recent-games`, {
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

      } catch (err) {
        setError('Failed to load account information');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId, user, token]);

  const handleViewSeasons = () => {
    if (user) {
      navigate(`/account/${accountId}/seasons`);
    } else {
      navigate('/login', { state: { from: location } });
    }
  };

  const handleManageAccount = () => {
    if (user) {
      navigate(`/account/${accountId}/management`);
    } else {
      navigate('/login', { state: { from: location } });
    }
  };

  const handleAccountSettings = () => {
    if (user) {
      navigate(`/account/${accountId}/settings`);
    } else {
      navigate('/login', { state: { from: location } });
    }
  };

  const handleViewTeam = (teamId: string) => {
    navigate(`/account/${accountId}/team/${teamId}`);
  };

  const handleViewStandings = () => {
    navigate(`/account/${accountId}/standings`);
  };

  const handleViewSchedule = () => {
    navigate(`/account/${accountId}/schedule`);
  };

  const handleViewStats = () => {
    navigate(`/account/${accountId}/statistics`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading baseball league information...
        </Typography>
      </Container>
    );
  }

  if (error || !account) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Account not found'}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/accounts')}>
            Back to Accounts
          </Button>
        </Box>
      </Container>
    );
  }

  const currentSeason = seasons.find(s => s.isCurrent);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Paper sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              mr: 3
            }}>
              <BaseballIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ 
                fontWeight: 'bold',
                color: 'primary.main'
              }}>
                {account.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Chip 
                  label={account.accountType} 
                  color="primary" 
                  variant="filled"
                  icon={<BaseballIcon />}
                  sx={{ fontWeight: 'bold' }}
                />
                {account.affiliation && (
                  <Chip 
                    label={account.affiliation} 
                    variant="outlined"
                    icon={<Group />}
                  />
                )}
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon fontSize="small" />
                {account.timezoneId} • Established {account.firstYear}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<ScheduleIcon />}
              onClick={handleViewSchedule}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 'bold'
              }}
            >
              View Schedule
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<StatsIcon />}
              onClick={handleViewStats}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 'bold'
              }}
            >
              Statistics
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<TrophyIcon />}
              onClick={handleViewStandings}
              sx={{ 
                borderRadius: 2,
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
                  sx={{ borderRadius: 2 }}
                >
                  Manage League
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={handleAccountSettings}
                  sx={{ borderRadius: 2 }}
                >
                  Settings
                </Button>
              </>
            )}
            {!user && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/login', { state: { from: location } })}
                sx={{ borderRadius: 2 }}
              >
                Sign In to Manage
              </Button>
            )}
          </Box>
        </Paper>

        {/* User Teams Section */}
        {user && userTeams.length > 0 && (
          <Paper sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <PersonIcon />
              My Teams
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3 
            }}>
              {userTeams.map((team) => (
                <Card key={team.id} sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: 'primary.main',
                        mr: 2
                      }}>
                        <BaseballIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {team.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {team.leagueName}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {team.record && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Record:</strong> {team.record}
                      </Typography>
                    )}
                    
                    {team.standing && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Standing:</strong> {team.standing}
                      </Typography>
                    )}

                    {team.nextGame && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
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
                      sx={{ mt: 2, borderRadius: 2 }}
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
          <Paper sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <CalendarMonth />
              Current Season
            </Typography>
            <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                sx={{ borderRadius: 2 }}
              >
                Season Details
              </Button>
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={handleViewSchedule}
                sx={{ borderRadius: 2 }}
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
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {leagues.length}
              </Typography>
              <Typography variant="body1">
                Leagues
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {leagues.reduce((total, league) => total + league.teamCount, 0)}
              </Typography>
              <Typography variant="body1">
                Teams
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {seasons.length}
              </Typography>
              <Typography variant="body1">
                Seasons
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {new Date().getFullYear() - account.firstYear + 1}
              </Typography>
              <Typography variant="body1">
                Years Active
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Recent Games */}
        {recentGames.length > 0 && (
          <Paper sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
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
                  border: game.status === 'completed' ? '2px solid #4caf50' : 
                          game.status === 'in_progress' ? '2px solid #ff9800' : '2px solid #e0e0e0'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(game.date).toLocaleDateString()}
                      </Typography>
                      <Chip 
                        label={game.status.replace('_', ' ')} 
                        size="small"
                        color={game.status === 'completed' ? 'success' : 
                               game.status === 'in_progress' ? 'warning' : 'default'}
                      />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
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
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Connect With Us
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {account.urls.length > 0 && (
              <Button
                variant="contained"
                href={account.urls[0].url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2 }}
              >
                Visit Website
              </Button>
            )}
            {account.twitterAccountName && (
              <Button
                variant="outlined"
                href={`https://twitter.com/${account.twitterAccountName.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2 }}
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
                sx={{ borderRadius: 2 }}
              >
                Facebook
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default BaseballAccountHome; 