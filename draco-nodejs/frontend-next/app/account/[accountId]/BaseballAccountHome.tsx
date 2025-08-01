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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Group as GroupIcon,
  LocationOn as LocationIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import TodayScoreboard from '../../../components/TodayScoreboard';
import YesterdayScoreboard from '../../../components/YesterdayScoreboard';
import GameRecapsWidget from '../../../components/GameRecapsWidget';
import MyTeams, { UserTeam } from '../../../components/MyTeams';
import AccountPageHeader from '../../../components/AccountPageHeader';
import OrganizationsWidget from '../../../components/OrganizationsWidget';
import ThemeSwitcher from '../../../components/ThemeSwitcher';

// Import Account type from OrganizationsWidget to avoid type conflicts
import type { Account as OrganizationAccount } from '../../../components/OrganizationsWidget';

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
  const [scoreboardLayout, setScoreboardLayout] = useState<'vertical' | 'horizontal'>('horizontal');
  const [hasAnyGames, setHasAnyGames] = useState(false);
  const [hasOtherOrganizations, setHasOtherOrganizations] = useState(false);
  const { user, token } = useAuth();
  const router = useRouter();
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  // Fetch public account data
  useEffect(() => {
    if (!accountIdStr) return;

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch account data
        const accountResponse = await fetch(`/api/accounts/${accountIdStr}?includeCurrentSeason`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

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
      } catch (err) {
        console.error('Failed to fetch account data:', err);
        setError('Failed to load account data');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountIdStr]);

  // Fetch user teams if logged in
  useEffect(() => {
    if (!accountIdStr || !user || !token) return;

    const fetchUserTeams = async () => {
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
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user teams:', err);
      }
    };

    fetchUserTeams();
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
    <main className="min-h-screen bg-background">
      {/* Unified Header with Logo and Page Content */}
      <Box>
        <AccountPageHeader accountId={account.id} accountLogoUrl={account.accountLogoUrl}>
          {account.affiliation &&
            account.affiliation.name &&
            account.affiliation.name.trim().toLowerCase() !== 'no affiliation' && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  mb: 1,
                  justifyContent: 'center',
                }}
              >
                {account.affiliation.url ? (
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
                    label={account.affiliation.name}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
              }}
            >
              <LocationIcon fontSize="small" />
              {currentSeason ? `${currentSeason.name} Season` : 'No Current Season'} • Established{' '}
              {account.firstYear}
            </Typography>
            <ThemeSwitcher />
          </Box>
        </AccountPageHeader>
      </Box>

      {/* Main Content - Single Column Layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Scoreboard Layout Toggle */}
        {hasAnyGames && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ToggleButtonGroup
              value={scoreboardLayout}
              exclusive
              onChange={(_, newLayout) => {
                if (newLayout !== null) {
                  setScoreboardLayout(newLayout);
                }
              }}
              aria-label="scoreboard layout"
              size="small"
            >
              <ToggleButton value="vertical" aria-label="vertical layout">
                <ViewListIcon sx={{ mr: 1 }} />
                Vertical
              </ToggleButton>
              <ToggleButton value="horizontal" aria-label="horizontal layout">
                <ViewModuleIcon sx={{ mr: 1 }} />
                Horizontal
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Scoreboard Widgets - Layout changes based on selected layout */}
        {currentSeason && (
          <Box
            sx={{
              display: scoreboardLayout === 'horizontal' ? 'flex' : 'grid',
              flexDirection: scoreboardLayout === 'horizontal' ? 'column' : undefined,
              gridTemplateColumns:
                scoreboardLayout === 'vertical'
                  ? {
                      xs: '1fr',
                      md: '1fr 1fr',
                    }
                  : undefined,
              gap: scoreboardLayout === 'horizontal' ? 1 : 3,
            }}
          >
            <TodayScoreboard
              accountId={accountIdStr!}
              layout={scoreboardLayout}
              currentSeasonId={currentSeason.id}
              onGamesLoaded={(games) => {
                if (games && games.length > 0) setHasAnyGames(true);
              }}
            />
            <YesterdayScoreboard
              accountId={accountIdStr!}
              layout={scoreboardLayout}
              currentSeasonId={currentSeason.id}
              onGamesLoaded={(games) => {
                if (games && games.length > 0) setHasAnyGames(true);
              }}
            />
          </Box>
        )}

        {/* Game Recaps Widget */}
        {currentSeason && (
          <GameRecapsWidget accountId={accountIdStr!} seasonId={currentSeason.id} />
        )}

        {/* User Teams Section */}
        {user && userTeams.length > 0 && (
          <MyTeams userTeams={userTeams} onViewTeam={handleViewTeam} title="Your Teams" />
        )}

        {/* Contact & Links */}
        <Paper sx={{ p: 4, borderRadius: 2, mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
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
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
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
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.main',
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
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                Facebook
              </Button>
            )}
          </Box>
        </Paper>

        {/* User Organizations Widget */}
        {user && hasOtherOrganizations && (
          <OrganizationsWidget
            title="Your Other Organizations"
            showSearch={false}
            maxDisplay={3}
            sx={{ mb: 0 }}
            excludeAccountId={accountIdStr}
            onOrganizationsLoaded={(organizations: OrganizationAccount[]) => {
              // Only show the widget if there are organizations to display (excluding current account)
              const otherOrganizations = organizations.filter((org) => org.id !== accountIdStr);
              setHasOtherOrganizations(otherOrganizations.length > 0);
            }}
          />
        )}
      </Box>
    </main>
  );
};

export default BaseballAccountHome;
