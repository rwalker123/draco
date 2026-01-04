'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  GolfCourse as GolfCourseIcon,
  TrendingUp as TrendingUpIcon,
  SportsGolf as SportsGolfIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import AccountPageHeader from '../../../components/AccountPageHeader';
import { getAccountById, Golfer, GolfScoreWithDetails } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { AccountSeasonWithStatusType, AccountType } from '@draco/shared-schemas';
import { useIndividualGolfAccountService } from '../../../hooks/useIndividualGolfAccountService';
import HomeCourseSearchDialog from '../../../components/golf/dialogs/HomeCourseSearchDialog';
import IndividualRoundEntryDialog from '../../../components/golf/dialogs/IndividualRoundEntryDialog';

const IndividualGolfAccountHome: React.FC = () => {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [currentSeason, setCurrentSeason] = useState<AccountSeasonWithStatusType | null>(null);
  const [golfer, setGolfer] = useState<Golfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeCourseDialogOpen, setHomeCourseDialogOpen] = useState(false);
  const [roundEntryDialogOpen, setRoundEntryDialogOpen] = useState(false);
  const [recentScores, setRecentScores] = useState<GolfScoreWithDetails[]>([]);
  const [editingScore, setEditingScore] = useState<GolfScoreWithDetails | null>(null);
  const [deleteConfirmScore, setDeleteConfirmScore] = useState<GolfScoreWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const apiClient = useApiClient();
  const { getGolfer, updateHomeCourse, getScores, deleteScore } = useIndividualGolfAccountService();

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

        const scoresResult = await getScores(accountIdStr, 20);
        if (isMounted && scoresResult.success) {
          setRecentScores(scoresResult.data);
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
  }, [accountIdStr, apiClient, getGolfer, getScores]);

  const handleRoundEntered = useCallback(
    async (score: GolfScoreWithDetails) => {
      setRecentScores((prev) => [score, ...prev.slice(0, 19)]);
      setRoundEntryDialogOpen(false);

      if (accountIdStr) {
        const golferResult = await getGolfer(accountIdStr);
        if (golferResult.success) {
          setGolfer(golferResult.data);
        }
      }
    },
    [accountIdStr, getGolfer],
  );

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

  const handleScoreUpdated = useCallback(
    async (updatedScore: GolfScoreWithDetails) => {
      setRecentScores((prev) =>
        prev.map((score) => (score.id === updatedScore.id ? updatedScore : score)),
      );
      setEditingScore(null);

      if (accountIdStr) {
        const golferResult = await getGolfer(accountIdStr);
        if (golferResult.success) {
          setGolfer(golferResult.data);
        }
      }
    },
    [accountIdStr, getGolfer],
  );

  const handleDeleteScore = useCallback(async () => {
    if (!accountIdStr || !deleteConfirmScore) return;

    setIsDeleting(true);
    const result = await deleteScore(accountIdStr, deleteConfirmScore.id);
    setIsDeleting(false);

    if (result.success) {
      setRecentScores((prev) => prev.filter((score) => score.id !== deleteConfirmScore.id));
      setDeleteConfirmScore(null);

      const golferResult = await getGolfer(accountIdStr);
      if (golferResult.success) {
        setGolfer(golferResult.data);
      }
    }
  }, [accountIdStr, deleteConfirmScore, deleteScore, getGolfer]);

  const contributingIndices = useMemo(() => {
    const differentials = recentScores
      .map((score, idx) => ({ idx, diff: score.differential }))
      .filter((item): item is { idx: number; diff: number } => item.diff != null);

    if (differentials.length < 3) {
      return new Set<number>();
    }

    const WHS_USE_COUNT: Record<number, number> = {
      3: 1,
      4: 1,
      5: 1,
      6: 2,
      7: 2,
      8: 2,
      9: 3,
      10: 3,
      11: 3,
      12: 4,
      13: 4,
      14: 5,
      15: 5,
      16: 6,
      17: 6,
      18: 7,
      19: 7,
      20: 8,
    };

    const count = Math.min(differentials.length, 20);
    const useCount = WHS_USE_COUNT[count] ?? 8;

    const sorted = [...differentials].sort((a, b) => a.diff - b.diff);
    return new Set(sorted.slice(0, useCount).map((item) => item.idx));
  }, [recentScores]);

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
                {golfer?.roundsPlayed ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentSeason ? 'This season' : 'Total rounds'}
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
                {golfer?.handicapIndex != null ? golfer.handicapIndex.toFixed(1) : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {golfer?.handicapIndex != null
                  ? 'Based on recent rounds'
                  : 'Enter 3+ scores to calculate'}
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
                {golfer?.averageScore != null ? golfer.averageScore : '--'}
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
              onClick={() => setRoundEntryDialogOpen(true)}
            >
              Enter a Round
            </Button>
          </Paper>
        )}

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Rounds
          </Typography>
          {recentScores.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No rounds recorded yet. Start tracking your golf scores to see your history here.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {recentScores.map((score, index) => (
                <Box
                  key={score.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  {contributingIndices.has(index) && (
                    <CheckCircleIcon
                      sx={{ color: 'success.main', mr: 1.5, fontSize: 20, flexShrink: 0 }}
                    />
                  )}
                  {!contributingIndices.has(index) && <Box sx={{ width: 32, flexShrink: 0 }} />}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={500} noWrap>
                      {score.courseName || 'Unknown Course'}
                      {score.tee?.teeName && ` · ${score.tee.teeName}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {[score.courseCity, score.courseState].filter(Boolean).join(', ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(score.datePlayed).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' · '}
                      {score.holesPlayed} holes
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', ml: 2 }}>
                    <Typography variant="h5" color="primary.main" fontWeight={600}>
                      {score.totalScore}
                    </Typography>
                    {score.differential != null && (
                      <Typography variant="body2" color="text.secondary">
                        Diff: {score.differential.toFixed(1)}
                      </Typography>
                    )}
                  </Box>
                  {isOwner && (
                    <Box sx={{ display: 'flex', ml: 1, gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => setEditingScore(score)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteConfirmScore(score)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Container>

      {accountIdStr && (
        <>
          <HomeCourseSearchDialog
            open={homeCourseDialogOpen}
            onClose={() => setHomeCourseDialogOpen(false)}
            onSelectCourse={handleUpdateHomeCourse}
            accountId={accountIdStr}
          />
          <IndividualRoundEntryDialog
            open={roundEntryDialogOpen}
            onClose={() => setRoundEntryDialogOpen(false)}
            onSuccess={handleRoundEntered}
            accountId={accountIdStr}
            homeCourse={golfer?.homeCourse}
          />
          <IndividualRoundEntryDialog
            open={!!editingScore}
            onClose={() => setEditingScore(null)}
            onSuccess={handleScoreUpdated}
            accountId={accountIdStr}
            homeCourse={golfer?.homeCourse}
            editScore={editingScore ?? undefined}
          />
          <Dialog
            open={!!deleteConfirmScore}
            onClose={() => setDeleteConfirmScore(null)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Delete Score?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this round from{' '}
                {deleteConfirmScore?.courseName || 'Unknown Course'} on{' '}
                {deleteConfirmScore?.datePlayed
                  ? new Date(deleteConfirmScore.datePlayed).toLocaleDateString()
                  : ''}
                ? This action cannot be undone and will affect your handicap calculation.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteConfirmScore(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteScore}
                color="error"
                variant="contained"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </main>
  );
};

export default IndividualGolfAccountHome;
