'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useLiveScoring } from '../../../context/LiveScoringContext';
import { useLiveScoringOperations } from '../../../hooks/useLiveScoringOperations';
import { getGolfTeamWithRoster } from '@draco/shared-api-client';
import type { GolfTeamWithRoster } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { LiveScoringProvider } from '../../../context/LiveScoringContext';

interface LiveScoringDialogProps {
  open: boolean;
  onClose: () => void;
  matchId: string;
  accountId: string;
  seasonId: string;
  team1Id: string;
  team2Id: string;
  hasActiveSession?: boolean;
}

interface GolferInfo {
  golferId: string;
  name: string;
  teamId: string;
  teamName: string;
}

function LiveScoringDialogContent({
  matchId,
  accountId,
  seasonId,
  team1Id,
  team2Id,
  hasActiveSession,
  onClose,
}: Omit<LiveScoringDialogProps, 'open'>) {
  const apiClient = useApiClient();
  const {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    connect,
    disconnect,
  } = useLiveScoring();

  const {
    isLoading,
    error: operationError,
    startSession,
    submitScore,
    advanceHole,
    finalizeSession,
    stopSession,
    clearError,
  } = useLiveScoringOperations();

  const [golfers, setGolfers] = useState<GolferInfo[]>([]);
  const [loadingGolfers, setLoadingGolfers] = useState(true);
  const [currentHole, setCurrentHole] = useState(1);
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [submittingGolferId, setSubmittingGolferId] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmColor: 'error' | 'primary' | 'success';
  } | null>(null);

  useEffect(() => {
    const loadTeamRosters = async () => {
      setLoadingGolfers(true);
      try {
        const [team1Result, team2Result] = await Promise.all([
          getGolfTeamWithRoster({
            client: apiClient,
            path: { accountId, seasonId, teamSeasonId: team1Id },
            throwOnError: false,
          }),
          getGolfTeamWithRoster({
            client: apiClient,
            path: { accountId, seasonId, teamSeasonId: team2Id },
            throwOnError: false,
          }),
        ]);

        const allGolfers: GolferInfo[] = [];

        if (team1Result.data) {
          const team = team1Result.data as GolfTeamWithRoster;
          team.roster.forEach((rosterEntry) => {
            allGolfers.push({
              golferId: rosterEntry.golferId,
              name: `${rosterEntry.player.firstName} ${rosterEntry.player.lastName}`,
              teamId: team1Id,
              teamName: team.name,
            });
          });
        }

        if (team2Result.data) {
          const team = team2Result.data as GolfTeamWithRoster;
          team.roster.forEach((rosterEntry) => {
            allGolfers.push({
              golferId: rosterEntry.golferId,
              name: `${rosterEntry.player.firstName} ${rosterEntry.player.lastName}`,
              teamId: team2Id,
              teamName: team.name,
            });
          });
        }

        setGolfers(allGolfers);
      } catch (err) {
        console.error('Failed to load team rosters:', err);
      } finally {
        setLoadingGolfers(false);
      }
    };

    loadTeamRosters();
  }, [apiClient, accountId, seasonId, team1Id, team2Id]);

  useEffect(() => {
    if (hasActiveSession) {
      connect(matchId);
    }
    return () => {
      disconnect();
    };
  }, [matchId, hasActiveSession, connect, disconnect]);

  useEffect(() => {
    if (sessionState?.currentHole) {
      setCurrentHole(sessionState.currentHole);
    }
  }, [sessionState?.currentHole]);

  useEffect(() => {
    if (isConnected && sessionState) {
      setStartingSession(false);
    }
  }, [isConnected, sessionState]);

  const handleStartSession = useCallback(async () => {
    setStartingSession(true);
    const result = await startSession(matchId, { startingHole: 1 });
    if (result) {
      connect(matchId);
    } else {
      setStartingSession(false);
    }
  }, [matchId, startSession, connect]);

  const handleScoreChange = (golferId: string, value: string) => {
    if (value === '' || /^\d{1,2}$/.test(value)) {
      setScoreInputs((prev) => ({ ...prev, [golferId]: value }));
    }
  };

  const handleScoreBlur = async (golferId: string) => {
    const scoreStr = scoreInputs[golferId];
    const existingScore = getScoreForGolferHole(golferId, currentHole);

    // If empty and no existing score, nothing to do
    if (!scoreStr && existingScore === undefined) return;

    // If the value hasn't changed from existing, nothing to do
    if (scoreStr === String(existingScore)) return;

    // If empty but had existing score, don't submit (user might be clearing to re-enter)
    if (!scoreStr) return;

    const score = parseInt(scoreStr, 10);
    if (isNaN(score) || score < 1 || score > 20) return;

    // Don't submit if same as existing score
    if (existingScore === score) return;

    setSubmittingGolferId(golferId);
    await submitScore(matchId, {
      golferId,
      holeNumber: currentHole,
      score,
    });
    setSubmittingGolferId(null);
  };

  const handleAdvanceHole = async (direction: 'prev' | 'next') => {
    const newHole = direction === 'next' ? currentHole + 1 : currentHole - 1;
    if (newHole < 1 || newHole > 18) return;

    // Submit any pending scores before changing holes
    const pendingSubmissions = golfers
      .filter((golfer) => {
        const inputValue = scoreInputs[golfer.golferId];
        const existingScore = getScoreForGolferHole(golfer.golferId, currentHole);
        if (!inputValue) return false;
        const score = parseInt(inputValue, 10);
        if (isNaN(score) || score < 1 || score > 20) return false;
        return existingScore !== score;
      })
      .map((golfer) => ({
        golferId: golfer.golferId,
        score: parseInt(scoreInputs[golfer.golferId], 10),
      }));

    // Submit all pending scores
    for (const { golferId, score } of pendingSubmissions) {
      await submitScore(matchId, {
        golferId,
        holeNumber: currentHole,
        score,
      });
    }

    // Clear inputs and switch to new hole
    setScoreInputs({});
    setCurrentHole(newHole);
    if (sessionState) {
      await advanceHole(matchId, newHole);
    }
  };

  const handleFinalize = () => {
    setConfirmDialog({
      open: true,
      title: 'Finalize Session',
      message:
        'Are you sure you want to finalize this live scoring session? This will save all scores to the match.',
      confirmText: 'Finalize Scores',
      confirmColor: 'success',
      onConfirm: async () => {
        setConfirmDialog(null);
        await finalizeSession(matchId);
        onClose();
      },
    });
  };

  const handleStop = () => {
    setConfirmDialog({
      open: true,
      title: 'Stop Session',
      message: 'Are you sure you want to stop this live scoring session? Scores will NOT be saved.',
      confirmText: 'Stop Session',
      confirmColor: 'error',
      onConfirm: async () => {
        setConfirmDialog(null);
        await stopSession(matchId);
        onClose();
      },
    });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog(null);
  };

  const getScoreForGolferHole = (golferId: string, hole: number): number | undefined => {
    const score = sessionState?.scores.find(
      (s) => s.golferId === golferId && s.holeNumber === hole,
    );
    return score?.score;
  };

  const getScoreEnteredBy = (golferId: string, hole: number): string | undefined => {
    const score = sessionState?.scores.find(
      (s) => s.golferId === golferId && s.holeNumber === hole,
    );
    return score?.enteredBy;
  };

  if (loadingGolfers) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const isSessionActive = sessionState?.status === 'active';
  const isSessionFinalized = sessionState?.status === 'finalized';

  return (
    <>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Live Scoring</Typography>
          {isSessionActive && (
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
              label="LIVE"
              size="small"
              color="error"
              sx={{ animation: 'pulse 2s infinite' }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isConnected && viewerCount > 0 && (
            <Chip
              icon={<VisibilityIcon sx={{ fontSize: 14 }} />}
              label={viewerCount}
              size="small"
              variant="outlined"
            />
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {(connectionError || operationError) && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => {
              clearError();
            }}
            action={
              connectionError && !isConnecting ? (
                <Button color="inherit" size="small" onClick={() => connect(matchId)}>
                  Retry
                </Button>
              ) : undefined
            }
          >
            {connectionError || operationError}
          </Alert>
        )}

        {!sessionState && !hasActiveSession && !isConnecting && !startingSession && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Start a live scoring session to enter scores hole-by-hole in real-time.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartSession}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
            >
              {isLoading ? 'Starting...' : 'Start Live Scoring'}
            </Button>
          </Box>
        )}

        {(sessionState || isConnecting || hasActiveSession || startingSession) && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              <IconButton
                onClick={() => handleAdvanceHole('prev')}
                disabled={currentHole <= 1 || isSessionFinalized}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h5" sx={{ minWidth: 100, textAlign: 'center' }}>
                Hole {currentHole}
              </Typography>
              <IconButton
                onClick={() => handleAdvanceHole('next')}
                disabled={currentHole >= 18 || isSessionFinalized}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {golfers.map((golfer) => {
                const existingScore = getScoreForGolferHole(golfer.golferId, currentHole);
                const enteredBy = getScoreEnteredBy(golfer.golferId, currentHole);
                const isSubmitting = submittingGolferId === golfer.golferId;

                return (
                  <Box
                    key={golfer.golferId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: existingScore ? 'action.selected' : 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {golfer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {golfer.teamName}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            type="number"
                            size="small"
                            value={
                              scoreInputs[golfer.golferId] !== undefined
                                ? scoreInputs[golfer.golferId]
                                : existingScore !== undefined
                                  ? String(existingScore)
                                  : ''
                            }
                            onChange={(e) => handleScoreChange(golfer.golferId, e.target.value)}
                            onBlur={() => handleScoreBlur(golfer.golferId)}
                            disabled={isSessionFinalized || isSubmitting}
                            inputProps={{
                              min: 1,
                              max: 20,
                              style: { width: 50, textAlign: 'center' },
                            }}
                            sx={{ width: 70 }}
                          />
                          {isSubmitting && <CircularProgress size={16} />}
                        </Box>
                        {enteredBy && (
                          <Typography variant="caption" color="text.secondary">
                            by {enteredBy}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {(isConnecting ||
              startingSession ||
              (hasActiveSession && !sessionState && !connectionError)) && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {startingSession && !isConnecting
                    ? 'Starting live session...'
                    : 'Connecting to live session...'}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {(isConnecting ||
          startingSession ||
          (hasActiveSession && !sessionState && !connectionError)) && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              disconnect();
              onClose();
            }}
          >
            Cancel
          </Button>
        )}
        {isSessionActive && (
          <>
            <Button variant="outlined" color="error" onClick={handleStop} disabled={isLoading}>
              Stop Session
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleFinalize}
              disabled={isLoading}
            >
              Finalize Scores
            </Button>
          </>
        )}
      </DialogActions>

      <Dialog
        open={confirmDialog?.open ?? false}
        onClose={handleCloseConfirmDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{confirmDialog?.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmDialog?.confirmColor ?? 'primary'}
            onClick={confirmDialog?.onConfirm}
            autoFocus
          >
            {confirmDialog?.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function LiveScoringDialog(props: LiveScoringDialogProps) {
  const { open, onClose, ...contentProps } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <LiveScoringProvider>
        <LiveScoringDialogContent {...contentProps} onClose={onClose} />
      </LiveScoringProvider>
    </Dialog>
  );
}
