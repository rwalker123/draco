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
  CalendarMonth,
  Group,
  Business,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import BaseballAccountHome from '../BaseballAccountHome';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';

interface Account {
  id: string;
  name: string;
  accountType?: string;
  accountTypeId?: string;
  firstYear: number | null;
  affiliation?: string;
  timezoneId?: string;
  twitterAccountName?: string;
  facebookFanPage?: string;
  urls: Array<{ id: string; url: string }>;
}

interface Season {
  id: string;
  name: string;
  isCurrent: boolean;
}

const AccountHome: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { accountId } = useParams();
  const apiClient = useApiClient();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;

  useEffect(() => {
    if (!accountIdStr) {
      setAccount(null);
      setSeasons([]);
      setError('Account not found or not publicly accessible');
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

        const { account: accountData, seasons: seasonList } = unwrapApiResult(
          result,
          'Account not found or not publicly accessible',
        );

        setAccount({
          id: accountData.id,
          name: accountData.name,
          accountType: accountData.configuration?.accountType?.name,
          accountTypeId: accountData.configuration?.accountType?.id,
          firstYear: accountData.configuration?.firstYear ?? null,
          affiliation: accountData.configuration?.affiliation?.name ?? undefined,
          timezoneId: accountData.configuration?.timezoneId ?? undefined,
          twitterAccountName: accountData.socials?.twitterAccountName ?? undefined,
          facebookFanPage: accountData.socials?.facebookFanPage ?? undefined,
          urls: accountData.urls ?? [],
        });
        setSeasons(seasonList ?? []);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load account information', err);
        setError('Failed to load account information');
        setAccount(null);
        setSeasons([]);
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

  const handleViewSeasons = () => {
    if (!accountIdStr) {
      return;
    }

    if (user) {
      router.push(`/account/${accountIdStr}/seasons`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  const handleManageAccount = () => {
    if (!accountIdStr) {
      return;
    }

    if (user) {
      router.push(`/account/${accountIdStr}/management`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  const handleAccountSettings = () => {
    if (!accountIdStr) {
      return;
    }

    if (user) {
      router.push(`/account/${accountIdStr}/settings`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  // Helper to get current path safely
  const getCurrentPath = () => (typeof window !== 'undefined' ? window.location.pathname : '/');

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading account information...
        </Typography>
      </Container>
    );
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

  // Render baseball-specific home page for baseball accounts
  if (account.accountType?.toLowerCase() === 'baseball') {
    return <BaseballAccountHome />;
  }

  const currentSeason = seasons.find((s) => s.isCurrent);
  const yearsActive =
    typeof account.firstYear === 'number'
      ? new Date().getFullYear() - account.firstYear + 1
      : 'N/A';

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {account.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <Chip
            label={account.accountType ?? 'Account'}
            color="primary"
            variant="outlined"
            icon={<Business />}
          />
          {account.affiliation && (
            <Chip label={account.affiliation} variant="outlined" icon={<Group />} />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          Established in {account.firstYear ?? 'N/A'} • {account.timezoneId ?? 'Unknown timezone'}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CalendarMonth />}
          onClick={handleViewSeasons}
        >
          View Seasons
        </Button>
        {user && (
          <>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleManageAccount}>
              Manage Account
            </Button>
            <Button variant="outlined" startIcon={<SettingsIcon />} onClick={handleAccountSettings}>
              Settings
            </Button>
          </>
        )}
        {!user && (
          <Button
            variant="outlined"
            onClick={() => router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`)}
          >
            Sign In to Manage
          </Button>
        )}
      </Box>

      {/* Current Season Info */}
      {currentSeason && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Current Season
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {currentSeason.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is the active season for {account.name}. View schedules, standings, and more.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<ViewIcon />} onClick={handleViewSeasons}>
              View Season Details
            </Button>
          </Box>
        </Paper>
      )}

      {/* Quick Stats */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h4" color="primary">
              {seasons.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Seasons
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h4" color="primary">
              {yearsActive}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Years Active
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h4" color="primary">
              {currentSeason ? 'Active' : 'Off Season'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current Status
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Contact & Links */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Contact & Links
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {account.urls.length > 0 && (
            <Button
              variant="outlined"
              href={account.urls[0].url}
              target="_blank"
              rel="noopener noreferrer"
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
            >
              Facebook
            </Button>
          )}
        </Box>
      </Paper>

      {/* Recent Seasons */}
      {seasons.length > 0 && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recent Seasons
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {seasons.slice(0, 5).map((season) => (
              <Chip
                key={season.id}
                label={season.name}
                color={season.isCurrent ? 'primary' : 'default'}
                variant={season.isCurrent ? 'filled' : 'outlined'}
                onClick={() => handleViewSeasons()}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Paper>
      )}
    </main>
  );
};

export default AccountHome;
