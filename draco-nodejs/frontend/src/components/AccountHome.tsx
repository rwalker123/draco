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
  Chip
} from '@mui/material';
import { 
  CalendarMonth, 
  Group, 
  Business,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BaseballAccountHome from './BaseballAccountHome';

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

const AccountHome: React.FC = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { accountId } = useParams();

  useEffect(() => {
    if (!accountId) return;

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/accounts/${accountId}/public`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAccount(data.data.account);
            setSeasons(data.data.seasons || []);
          } else {
            setError(data.message || 'Account not found or not publicly accessible');
          }
        } else {
          setError('Account not found or not publicly accessible');
        }
      } catch (err) {
        setError('Failed to load account information');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId]);

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

  // Render baseball-specific home page for baseball accounts
  if (account.accountType.toLowerCase() === 'baseball') {
    return <BaseballAccountHome />;
  }

  const currentSeason = seasons.find(s => s.isCurrent);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {account.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <Chip 
            label={account.accountType} 
            color="primary" 
            variant="outlined"
            icon={<Business />}
          />
          {account.affiliation && (
            <Chip 
              label={account.affiliation} 
              variant="outlined"
              icon={<Group />}
            />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          Established in {account.firstYear} • {account.timezoneId}
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
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleManageAccount}
            >
              Manage Account
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleAccountSettings}
            >
              Settings
            </Button>
          </>
        )}
        {!user && (
          <Button
            variant="outlined"
            onClick={() => navigate('/login', { state: { from: location } })}
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
            <Button
              variant="contained"
              startIcon={<ViewIcon />}
              onClick={handleViewSeasons}
            >
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
              {new Date().getFullYear() - account.firstYear + 1}
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
    </Container>
  );
};

export default AccountHome; 