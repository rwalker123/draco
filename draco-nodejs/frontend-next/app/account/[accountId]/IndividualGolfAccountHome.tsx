'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  GolfCourse as GolfCourseIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  PlayCircle as LiveIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import AccountPageHeader from '../../../components/AccountPageHeader';
import {
  getAccountById,
  Golfer,
  GolfScoreWithDetails,
  GolferSummary,
} from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import {
  AccountSeasonWithStatusType,
  AccountType,
  getContributingDifferentialIndices,
} from '@draco/shared-schemas';
import { useIndividualGolfAccountService } from '../../../hooks/useIndividualGolfAccountService';
import HomeCourseSearchDialog from '../../../components/golf/dialogs/HomeCourseSearchDialog';
import IndividualRoundEntryDialog from '../../../components/golf/dialogs/IndividualRoundEntryDialog';
import OrganizationsWidget from '../../../components/OrganizationsWidget';
import GolferStatsCards from '../../../components/golf/stats/GolferStatsCards';
import GolfScoresList from '../../../components/golf/scores/GolfScoresList';
import StartLiveRoundDialog from '../../../components/golf/dialogs/StartLiveRoundDialog';
import LiveRoundCard from '../../../components/golf/live-scoring/LiveRoundCard';
import IndividualLiveScoringDialog from '../../../components/golf/live-scoring/IndividualLiveScoringDialog';
import IndividualLiveWatchDialog from '../../../components/golf/live-scoring/IndividualLiveWatchDialog';
import { useIndividualLiveScoringOperations } from '../../../hooks/useIndividualLiveScoringOperations';
import type { IndividualLiveScoringState } from '../../../context/IndividualLiveScoringContext';

const IndividualGolfAccountHome: React.FC = () => {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [currentSeason, setCurrentSeason] = useState<AccountSeasonWithStatusType | null>(null);
  const [golfer, setGolfer] = useState<Golfer | null>(null);
  const [golferSummary, setGolferSummary] = useState<GolferSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeCourseDialogOpen, setHomeCourseDialogOpen] = useState(false);
  const [roundEntryDialogOpen, setRoundEntryDialogOpen] = useState(false);
  const [recentScores, setRecentScores] = useState<GolfScoreWithDetails[]>([]);
  const [editingScore, setEditingScore] = useState<GolfScoreWithDetails | null>(null);
  const [deleteConfirmScore, setDeleteConfirmScore] = useState<GolfScoreWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [startLiveRoundDialogOpen, setStartLiveRoundDialogOpen] = useState(false);
  const [liveScoringDialogOpen, setLiveScoringDialogOpen] = useState(false);
  const [liveWatchDialogOpen, setLiveWatchDialogOpen] = useState(false);
  const [liveSession, setLiveSession] = useState<IndividualLiveScoringState | null>(null);
  const [isStartingLiveSession, setIsStartingLiveSession] = useState(false);
  const [cancelSessionConfirmOpen, setCancelSessionConfirmOpen] = useState(false);
  const [isCancellingSession, setIsCancellingSession] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const apiClient = useApiClient();
  const { getGolfer, getGolferSummary, updateHomeCourse, getScores, deleteScore } =
    useIndividualGolfAccountService();
  const { checkSessionStatus, getSessionState, startSession, stopSession } =
    useIndividualLiveScoringOperations();

  useEffect(() => {
    if (!accountIdStr) {
      setAccount(null);
      setCurrentSeason(null);
      setError('Account ID not found');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId: accountIdStr },
          query: { includeCurrentSeason: true },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const { account: accountData, currentSeason: responseCurrentSeason } = unwrapApiResult(
          result,
          'Account not found or not publicly accessible',
        );
        const typedAccount = accountData as AccountType;
        setAccount(typedAccount);
        setCurrentSeason(responseCurrentSeason as AccountSeasonWithStatusType | null);

        const summaryResult = await getGolferSummary(accountIdStr);
        if (!controller.signal.aborted && summaryResult.success) {
          setGolferSummary(summaryResult.data);
        }

        const isCurrentUserOwner = user?.userId === typedAccount.accountOwner?.user?.userId;

        if (isCurrentUserOwner) {
          const golferResult = await getGolfer(accountIdStr);
          if (!controller.signal.aborted && golferResult.success) {
            setGolfer(golferResult.data);
          }

          const scoresResult = await getScores(accountIdStr, 20);
          if (!controller.signal.aborted && scoresResult.success) {
            setRecentScores(scoresResult.data);
          }
        }

        const liveStatus = await checkSessionStatus(accountIdStr);
        if (!controller.signal.aborted && liveStatus?.hasActiveSession) {
          const sessionState = await getSessionState(accountIdStr);
          if (!controller.signal.aborted && sessionState) {
            setLiveSession(sessionState);
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch account data:', err);
        setError('Failed to load account data');
        setAccount(null);
        setCurrentSeason(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAccountData();

    return () => {
      controller.abort();
    };
  }, [
    accountIdStr,
    apiClient,
    getGolfer,
    getGolferSummary,
    getScores,
    user?.userId,
    checkSessionStatus,
    getSessionState,
  ]);

  const handleRoundEntered = async (score: GolfScoreWithDetails) => {
    setRecentScores((prev) => [score, ...prev.slice(0, 19)]);
    setRoundEntryDialogOpen(false);

    if (accountIdStr) {
      const summaryResult = await getGolferSummary(accountIdStr);
      if (summaryResult.success) {
        setGolferSummary(summaryResult.data);
      }
    }
  };

  const handleUpdateHomeCourse = async (
    courseId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!accountIdStr) {
      return { success: false, error: 'Account ID not found' };
    }

    const result = await updateHomeCourse(accountIdStr, courseId);
    if (result.success) {
      setGolfer(result.data);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const handleScoreUpdated = async (updatedScore: GolfScoreWithDetails) => {
    setRecentScores((prev) =>
      prev.map((score) => (score.id === updatedScore.id ? updatedScore : score)),
    );
    setEditingScore(null);

    if (accountIdStr) {
      const summaryResult = await getGolferSummary(accountIdStr);
      if (summaryResult.success) {
        setGolferSummary(summaryResult.data);
      }
    }
  };

  const handleDeleteScore = async () => {
    if (!accountIdStr || !deleteConfirmScore) return;

    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteScore(accountIdStr, deleteConfirmScore.id);
    setIsDeleting(false);

    if (result.success) {
      setRecentScores((prev) => prev.filter((score) => score.id !== deleteConfirmScore.id));
      setDeleteConfirmScore(null);

      const summaryResult = await getGolferSummary(accountIdStr);
      if (summaryResult.success) {
        setGolferSummary(summaryResult.data);
      }
    } else {
      setDeleteError(result.error);
    }
  };

  const handleStartLiveRound = async (data: {
    courseId: string;
    teeId: string;
    datePlayed: string;
    startingHole: number;
    holesPlayed: 9 | 18;
  }): Promise<boolean> => {
    console.log('[LIVE_HOME] handleStartLiveRound called', { accountIdStr, data });
    if (!accountIdStr) {
      console.log('[LIVE_HOME] No accountIdStr, returning false');
      return false;
    }

    setIsStartingLiveSession(true);
    console.log('[LIVE_HOME] Calling startSession...');
    const result = await startSession(accountIdStr, data);
    console.log('[LIVE_HOME] startSession returned', { result });
    setIsStartingLiveSession(false);

    if (result) {
      console.log(
        '[LIVE_HOME] Session started successfully, setting liveSession and opening dialog',
      );
      setLiveSession(result);
      setStartLiveRoundDialogOpen(false);
      setLiveScoringDialogOpen(true);
      return true;
    }
    console.log('[LIVE_HOME] startSession returned null/falsy');
    return false;
  };

  const handleLiveSessionEnded = async () => {
    setLiveSession(null);
    setLiveScoringDialogOpen(false);

    if (accountIdStr) {
      const scoresResult = await getScores(accountIdStr, 20);
      if (scoresResult.success) {
        setRecentScores(scoresResult.data);
      }

      const summaryResult = await getGolferSummary(accountIdStr);
      if (summaryResult.success) {
        setGolferSummary(summaryResult.data);
      }
    }
  };

  const handleCancelSession = async () => {
    if (!accountIdStr) return;

    setIsCancellingSession(true);
    const success = await stopSession(accountIdStr);
    setIsCancellingSession(false);

    if (success) {
      setLiveSession(null);
      setCancelSessionConfirmOpen(false);
    }
  };

  const indexedDifferentials = recentScores
    .map((score, idx) => ({ idx, diff: score.differential }))
    .filter((item): item is { idx: number; diff: number } => item.diff != null);

  const contributingIndices =
    indexedDifferentials.length < 3
      ? new Set<number>()
      : new Set(
          [
            ...getContributingDifferentialIndices(indexedDifferentials.map((item) => item.diff)),
          ].map((diffIndex) => indexedDifferentials[diffIndex].idx),
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
        {liveSession && (
          <LiveRoundCard
            session={liveSession}
            isOwner={isOwner}
            onContinue={() => setLiveScoringDialogOpen(true)}
            onWatch={() => setLiveWatchDialogOpen(true)}
            onCancel={() => setCancelSessionConfirmOpen(true)}
          />
        )}

        <GolferStatsCards
          roundsPlayed={golferSummary?.roundsPlayed ?? 0}
          handicapIndex={golferSummary?.handicapIndex ?? null}
          averageScore={golferSummary?.averageScore ?? null}
          seasonLabel={currentSeason ? 'This season' : 'Total rounds'}
        />

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

        {isOwner && !liveSession && (
          <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Get Started
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Track your golf rounds to see your handicap and statistics.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setRoundEntryDialogOpen(true)}
              >
                Enter a Round
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<LiveIcon />}
                onClick={() => setStartLiveRoundDialogOpen(true)}
                color="error"
              >
                Start Live Round
              </Button>
            </Box>
          </Paper>
        )}

        {isOwner && (
          <GolfScoresList
            scores={recentScores}
            contributingIndices={contributingIndices}
            showOwnerActions={isOwner}
            onEdit={setEditingScore}
            onDelete={setDeleteConfirmScore}
            emptyMessage="No rounds recorded yet. Start tracking your golf scores to see your previously played rounds."
          />
        )}

        <OrganizationsWidget
          title="My Organizations"
          excludeAccountId={accountIdStr}
          sx={{ mt: 4 }}
        />
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
            onClose={() => {
              setDeleteConfirmScore(null);
              setDeleteError(null);
            }}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Delete Score?</DialogTitle>
            <DialogContent>
              {deleteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {deleteError}
                </Alert>
              )}
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
              <Button
                onClick={() => {
                  setDeleteConfirmScore(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
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
          <Dialog
            open={cancelSessionConfirmOpen}
            onClose={() => setCancelSessionConfirmOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle>Cancel Live Session?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to cancel this live scoring session? All scores entered during
                this session will be discarded and cannot be recovered.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setCancelSessionConfirmOpen(false)}
                disabled={isCancellingSession}
              >
                Keep Session
              </Button>
              <Button
                onClick={handleCancelSession}
                color="error"
                variant="contained"
                disabled={isCancellingSession}
              >
                {isCancellingSession ? 'Cancelling...' : 'Cancel Session'}
              </Button>
            </DialogActions>
          </Dialog>
          <StartLiveRoundDialog
            open={startLiveRoundDialogOpen}
            onClose={() => setStartLiveRoundDialogOpen(false)}
            onStart={handleStartLiveRound}
            accountId={accountIdStr}
            homeCourse={golfer?.homeCourse}
            isStarting={isStartingLiveSession}
          />
          <IndividualLiveScoringDialog
            open={liveScoringDialogOpen}
            onClose={() => setLiveScoringDialogOpen(false)}
            accountId={accountIdStr}
            hasActiveSession={!!liveSession}
            onSessionEnded={handleLiveSessionEnded}
          />
          <IndividualLiveWatchDialog
            open={liveWatchDialogOpen}
            onClose={() => setLiveWatchDialogOpen(false)}
            accountId={accountIdStr}
          />
        </>
      )}
    </main>
  );
};

export default IndividualGolfAccountHome;
