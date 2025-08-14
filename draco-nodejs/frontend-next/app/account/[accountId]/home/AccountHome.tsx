import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
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
import { listWorkouts } from '../../../../services/workoutService';
import { WorkoutSummary } from '../../../../types/workouts';
import { WorkoutCard } from '../../../../components/workouts/WorkoutCard';
import { WorkoutRegistrationForm } from '../../../../components/workouts/WorkoutRegistrationForm';

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
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSummary | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { accountId } = useParams();

  useEffect(() => {
    if (!accountId) return;

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/accounts/${accountId}`, {
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
      } catch {
        setError('Failed to load account information');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId]);

  const fetchUpcomingWorkouts = useCallback(async () => {
    try {
      const allWorkouts = await listWorkouts(accountId as string, false);
      // Filter for upcoming workouts on the frontend
      const upcoming = allWorkouts
        .filter((workout) => new Date(workout.workoutDate) > new Date())
        .sort((a, b) => new Date(a.workoutDate).getTime() - new Date(b.workoutDate).getTime())
        .slice(0, 3); // Limit to 3 upcoming workouts
      setWorkouts(upcoming);
    } catch (error) {
      console.error('Failed to fetch upcoming workouts:', error);
    }
  }, [accountId]);

  useEffect(() => {
    fetchUpcomingWorkouts();
  }, [fetchUpcomingWorkouts]);

  const handleViewSeasons = () => {
    if (user) {
      router.push(`/account/${accountId}/seasons`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  const handleManageAccount = () => {
    if (user) {
      router.push(`/account/${accountId}/management`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  const handleAccountSettings = () => {
    if (user) {
      router.push(`/account/${accountId}/settings`);
    } else {
      router.push(`/login?from=${encodeURIComponent(getCurrentPath())}`);
    }
  };

  const handleWorkoutRegister = (workout: WorkoutSummary) => {
    setSelectedWorkout(workout);
    setRegistrationDialogOpen(true);
  };

  const handleViewAllWorkouts = () => {
    router.push(`/account/${accountId}/workouts`);
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
  if (account.accountType.toLowerCase() === 'baseball') {
    return <BaseballAccountHome />;
  }

  const currentSeason = seasons.find((s) => s.isCurrent);

  return (
    <main className="min-h-screen bg-background">
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
            <Chip label={account.affiliation} variant="outlined" icon={<Group />} />
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

      {/* Upcoming Workouts Section */}
      {workouts.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5" gutterBottom>
              Upcoming Workouts
            </Typography>
            <Button variant="outlined" onClick={handleViewAllWorkouts}>
              View All
            </Button>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {workouts.map((workout) => (
              <Box key={workout.id}>
                <WorkoutCard
                  workout={workout}
                  onRegister={() => handleWorkoutRegister(workout)}
                  showRegisterButton={true}
                />
              </Box>
            ))}
          </Box>
        </Paper>
      )}

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

      {/* Registration Dialog */}
      {selectedWorkout && (
        <Dialog
          open={registrationDialogOpen}
          onClose={() => {
            setRegistrationDialogOpen(false);
            setSelectedWorkout(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{selectedWorkout.workoutDesc}</DialogTitle>
          <DialogContent>
            <WorkoutRegistrationForm
              workoutId={selectedWorkout.id}
              accountId={accountId as string}
              onSubmit={async (_data) => {
                try {
                  // This will be implemented when we add the createRegistration service call
                  console.log('Registration data:', _data);
                  setRegistrationDialogOpen(false);
                  setSelectedWorkout(null);
                } catch (error) {
                  console.error('Failed to register:', error);
                }
              }}
              onCancel={() => {
                setRegistrationDialogOpen(false);
                setSelectedWorkout(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
};

export default AccountHome;
