'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import {
  GolfCourse as GolfCourseIcon,
  TrendingUp as TrendingUpIcon,
  SportsGolf as SportsGolfIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import AccountPageHeader from '../../../components/AccountPageHeader';
import { getAccountById, Golfer } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { AccountSeasonWithStatusType, AccountType } from '@draco/shared-schemas';
import { useIndividualGolfAccountService } from '../../../hooks/useIndividualGolfAccountService';
import HomeCourseSearchDialog from '../../../components/golf/dialogs/HomeCourseSearchDialog';

const IndividualGolfAccountHome: React.FC = () => {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [currentSeason, setCurrentSeason] = useState<AccountSeasonWithStatusType | null>(null);
  const [golfer, setGolfer] = useState<Golfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeCourseDialogOpen, setHomeCourseDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const apiClient = useApiClient();
  const { getGolfer, updateHomeCourse } = useIndividualGolfAccountService();

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

        const golferResult = await getGolfer(accountIdStr);
        if (isMounted && golferResult.success) {
          setGolfer(golferResult.data);
        }
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
  }, [accountIdStr, apiClient, getGolfer]);

  const handleUpdateHomeCourse = useCallback(
    async (courseId: string): Promise<{ success: boolean; error?: string }> => {
      if (!accountIdStr) {
        return { success: false, error: 'Account ID not found' };
      }

      const result = await updateHomeCourse(accountIdStr, courseId);
      if (result.success) {
        setGolfer(result.data);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [accountIdStr, updateHomeCourse],
  );

  if (!accountIdStr) {
    return (
      <Container maxWidth="xl" disableGutters sx={{ py: 4, px: { xs: 1, sm: 1.5 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Account ID not found
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Home
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
          Back to Home
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
          Back to Home
        </Button>
      </Container>
    );
  }

  const isOwner = user?.userId === account.accountOwner?.user?.userId;

  return (
    <main className="min-h-screen bg-background">
      <Box>
        <AccountPageHeader accountId={account.id} accountLogoUrl={account.accountLogoUrl}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <GolfCourseIcon fontSize="small" />
            <Typography
              variant="body1"
              sx={{
                color: (theme) => theme.palette.text.primary,
                textAlign: 'center',
              }}
            >
              {currentSeason ? `${currentSeason.name} Season` : 'Personal Golf Tracking'}
            </Typography>
          </Box>
        </AccountPageHeader>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SportsGolfIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Rounds Played
              </Typography>
              <Typography variant="h3" color="primary.main">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This season
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Handicap Index
              </Typography>
              <Typography variant="h3" color="success.main">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter scores to calculate
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <GolfCourseIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h3" color="info.main">
                --
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Per 18 holes
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {isOwner && (
          <Paper sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <HomeIcon color="primary" />
              <Typography variant="h5">Home Course</Typography>
            </Box>
            {golfer?.homeCourse ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">{golfer.homeCourse.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[golfer.homeCourse.city, golfer.homeCourse.state].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setHomeCourseDialogOpen(true)}
                >
                  Change
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Set your home course to track rounds and get course-specific handicaps.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<GolfCourseIcon />}
                  onClick={() => setHomeCourseDialogOpen(true)}
                >
                  Set Your Home Course
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {isOwner && (
          <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Get Started
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Track your golf rounds to see your handicap and statistics.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => {
                // TODO: Implement score entry
              }}
              disabled
            >
              Enter a Round (Coming Soon)
            </Button>
          </Paper>
        )}

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Rounds
          </Typography>
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No rounds recorded yet. Start tracking your golf scores to see your history here.
            </Typography>
          </Box>
        </Paper>
      </Container>

      {accountIdStr && (
        <HomeCourseSearchDialog
          open={homeCourseDialogOpen}
          onClose={() => setHomeCourseDialogOpen(false)}
          onSelectCourse={handleUpdateHomeCourse}
          accountId={accountIdStr}
        />
      )}
    </main>
  );
};

export default IndividualGolfAccountHome;
