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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useBaseballLiveScoring } from '../../../context/BaseballLiveScoringContext';
import { useBaseballLiveScoringOperations } from '../../../hooks/useBaseballLiveScoringOperations';
import { BaseballLiveScoringProvider } from '../../../context/BaseballLiveScoringContext';

interface BaseballLiveScoringDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  accountId: string;
  homeTeamName: string;
  visitorTeamName: string;
  hasActiveSession?: boolean;
}

function BaseballLiveScoringDialogContent({
  gameId,
  homeTeamName,
  visitorTeamName,
  hasActiveSession,
  onClose,
}: Omit<BaseballLiveScoringDialogProps, 'open' | 'accountId'>) {
  const {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    scorerCount,
    connect,
    disconnect,
  } = useBaseballLiveScoring();

  const {
    isLoading,
    error: operationError,
    startSession,
    submitScore,
    advanceInning,
    finalizeSession,
    stopSession,
    clearError,
  } = useBaseballLiveScoringOperations();

  const [currentInning, setCurrentInning] = useState(1);
  const [homeRunsInput, setHomeRunsInput] = useState<string>('');
  const [visitorRunsInput, setVisitorRunsInput] = useState<string>('');
  const [submittingTeam, setSubmittingTeam] = useState<'home' | 'visitor' | null>(null);
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
    if (hasActiveSession) {
      connect(gameId, 'scorer');
    }
    return () => {
      disconnect();
    };
  }, [gameId, hasActiveSession, connect, disconnect]);

  useEffect(() => {
    if (sessionState?.currentInning) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate sync from SSE session state */
      setCurrentInning(sessionState.currentInning);
    }
  }, [sessionState?.currentInning]);

  useEffect(() => {
    if (isConnected && sessionState) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate sync from SSE connection state */
      setStartingSession(false);
    }
  }, [isConnected, sessionState]);

  const getScoreForInning = useCallback(
    (inning: number, isHomeTeam: boolean): number | undefined => {
      const score = sessionState?.scores.find(
        (s) => s.inningNumber === inning && s.isHomeTeam === isHomeTeam,
      );
      return score?.runs;
    },
    [sessionState?.scores],
  );

  useEffect(() => {
    if (sessionState) {
      const homeScore = getScoreForInning(currentInning, true);
      const visitorScore = getScoreForInning(currentInning, false);
      /* eslint-disable react-hooks/set-state-in-effect -- legitimate sync from SSE session scores */
      setHomeRunsInput(homeScore !== undefined ? String(homeScore) : '');
      setVisitorRunsInput(visitorScore !== undefined ? String(visitorScore) : '');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [currentInning, sessionState, getScoreForInning]);

  const handleStartSession = useCallback(async () => {
    setStartingSession(true);
    const result = await startSession(gameId);
    if (result) {
      connect(gameId);
    } else {
      setStartingSession(false);
    }
  }, [gameId, startSession, connect]);

  const handleRunsChange = (team: 'home' | 'visitor', value: string) => {
    if (value === '' || /^\d{1,2}$/.test(value)) {
      if (team === 'home') {
        setHomeRunsInput(value);
      } else {
        setVisitorRunsInput(value);
      }
    }
  };

  const handleScoreBlur = async (isHomeTeam: boolean) => {
    const runsStr = isHomeTeam ? homeRunsInput : visitorRunsInput;
    const existingScore = getScoreForInning(currentInning, isHomeTeam);

    if (!runsStr && existingScore === undefined) return;
    if (runsStr === String(existingScore)) return;
    if (!runsStr) return;

    const runs = parseInt(runsStr, 10);
    if (isNaN(runs) || runs < 0 || runs > 99) return;
    if (existingScore === runs) return;

    setSubmittingTeam(isHomeTeam ? 'home' : 'visitor');
    await submitScore(gameId, {
      inningNumber: currentInning,
      isHomeTeam,
      runs,
    });
    setSubmittingTeam(null);
  };

  const handleAdvanceInning = async (direction: 'prev' | 'next') => {
    const newInning = direction === 'next' ? currentInning + 1 : currentInning - 1;
    if (newInning < 1 || newInning > 99) return;

    // Submit any pending scores before changing innings
    const homeRuns = parseInt(homeRunsInput, 10);
    const visitorRuns = parseInt(visitorRunsInput, 10);

    if (!isNaN(homeRuns) && homeRuns >= 0 && getScoreForInning(currentInning, true) !== homeRuns) {
      await submitScore(gameId, {
        inningNumber: currentInning,
        isHomeTeam: true,
        runs: homeRuns,
      });
    }

    if (
      !isNaN(visitorRuns) &&
      visitorRuns >= 0 &&
      getScoreForInning(currentInning, false) !== visitorRuns
    ) {
      await submitScore(gameId, {
        inningNumber: currentInning,
        isHomeTeam: false,
        runs: visitorRuns,
      });
    }

    setCurrentInning(newInning);
    if (sessionState) {
      await advanceInning(gameId, newInning);
    }
  };

  const handleFinalize = () => {
    setConfirmDialog({
      open: true,
      title: 'Finalize Game',
      message:
        'Are you sure you want to finalize this game? This will save all scores and mark the game as complete.',
      confirmText: 'Finalize Game',
      confirmColor: 'success',
      onConfirm: async () => {
        setConfirmDialog(null);
        await finalizeSession(gameId);
        onClose();
      },
    });
  };

  const handleStop = () => {
    const otherScorers = Math.max(0, scorerCount - 1);
    const message =
      otherScorers > 0
        ? `There ${otherScorers === 1 ? 'is' : 'are'} ${otherScorers} other ${otherScorers === 1 ? 'person' : 'people'} currently entering scores. Stopping this session will end it for everyone. Scores will NOT be saved.`
        : 'Are you sure you want to stop this live scoring session? Scores will NOT be saved.';

    setConfirmDialog({
      open: true,
      title: 'Stop Session',
      message,
      confirmText: 'Stop Session',
      confirmColor: 'error',
      onConfirm: async () => {
        setConfirmDialog(null);
        await stopSession(gameId);
        onClose();
      },
    });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog(null);
  };

  const getMaxInningWithScores = (): number => {
    if (!sessionState?.scores.length) return 0;
    return Math.max(...sessionState.scores.map((s) => s.inningNumber));
  };

  const isSessionActive = sessionState?.status === 'active';
  const isSessionFinalized = sessionState?.status === 'finalized';
  const maxInning = getMaxInningWithScores();

  // Build innings array for the scoreboard (up to current inning or max scored inning + 1)
  const displayInnings = Math.max(currentInning, maxInning, 1);
  const inningsToShow = Array.from({ length: Math.min(displayInnings, 9) }, (_, i) => i + 1);

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
                <Button color="inherit" size="small" onClick={() => connect(gameId)}>
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
              Start a live scoring session to enter scores inning-by-inning in real-time.
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
            {/* Inning Navigation */}
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
                onClick={() => handleAdvanceInning('prev')}
                disabled={currentInning <= 1 || isSessionFinalized}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h5" sx={{ minWidth: 120, textAlign: 'center' }}>
                Inning {currentInning}
              </Typography>
              <IconButton onClick={() => handleAdvanceInning('next')} disabled={isSessionFinalized}>
                <ChevronRightIcon />
              </IconButton>
            </Box>

            {/* Scoreboard */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Team</TableCell>
                    {inningsToShow.map((inning) => (
                      <TableCell
                        key={inning}
                        align="center"
                        sx={{
                          bgcolor: inning === currentInning ? 'primary.light' : undefined,
                          color: inning === currentInning ? 'primary.contrastText' : undefined,
                        }}
                      >
                        {inning}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      R
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      {visitorTeamName}
                    </TableCell>
                    {inningsToShow.map((inning) => {
                      const runs = getScoreForInning(inning, false);
                      return (
                        <TableCell
                          key={inning}
                          align="center"
                          sx={{
                            bgcolor: inning === currentInning ? 'primary.light' : undefined,
                            color: inning === currentInning ? 'primary.contrastText' : undefined,
                          }}
                        >
                          {runs ?? '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {sessionState?.visitorTeamTotal ?? 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      {homeTeamName}
                    </TableCell>
                    {inningsToShow.map((inning) => {
                      const runs = getScoreForInning(inning, true);
                      return (
                        <TableCell
                          key={inning}
                          align="center"
                          sx={{
                            bgcolor: inning === currentInning ? 'primary.light' : undefined,
                            color: inning === currentInning ? 'primary.contrastText' : undefined,
                          }}
                        >
                          {runs ?? '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {sessionState?.homeTeamTotal ?? 0}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Current Inning Score Entry */}
            {!isSessionFinalized && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Enter Runs for Inning {currentInning}:
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body1" fontWeight={500}>
                    {visitorTeamName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="number"
                      size="small"
                      value={visitorRunsInput}
                      onChange={(e) => handleRunsChange('visitor', e.target.value)}
                      onBlur={() => handleScoreBlur(false)}
                      disabled={isSessionFinalized || submittingTeam === 'visitor'}
                      inputProps={{
                        min: 0,
                        max: 99,
                        style: { width: 50, textAlign: 'center' },
                      }}
                      sx={{ width: 70 }}
                    />
                    {submittingTeam === 'visitor' && <CircularProgress size={16} />}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body1" fontWeight={500}>
                    {homeTeamName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="number"
                      size="small"
                      value={homeRunsInput}
                      onChange={(e) => handleRunsChange('home', e.target.value)}
                      onBlur={() => handleScoreBlur(true)}
                      disabled={isSessionFinalized || submittingTeam === 'home'}
                      inputProps={{
                        min: 0,
                        max: 99,
                        style: { width: 50, textAlign: 'center' },
                      }}
                      sx={{ width: 70 }}
                    />
                    {submittingTeam === 'home' && <CircularProgress size={16} />}
                  </Box>
                </Box>
              </Box>
            )}

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
              Finalize Game
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

export default function BaseballLiveScoringDialog(props: BaseballLiveScoringDialogProps) {
  const { open, onClose, ...contentProps } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <BaseballLiveScoringProvider>
        <BaseballLiveScoringDialogContent {...contentProps} onClose={onClose} />
      </BaseballLiveScoringProvider>
    </Dialog>
  );
}
