'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

interface InningScoreEntryProps {
  inning: number;
  homeScore: number | undefined;
  visitorScore: number | undefined;
  homeTeamName: string;
  visitorTeamName: string;
  gameId: string;
  disabled: boolean;
}

function InningScoreEntry({
  inning,
  homeScore,
  visitorScore,
  homeTeamName,
  visitorTeamName,
  gameId,
  disabled,
}: InningScoreEntryProps) {
  const { submitScore } = useBaseballLiveScoringOperations();

  const [homeRunsInput, setHomeRunsInput] = useState(
    homeScore !== undefined ? String(homeScore) : '',
  );
  const [visitorRunsInput, setVisitorRunsInput] = useState(
    visitorScore !== undefined ? String(visitorScore) : '',
  );
  const [submittingTeam, setSubmittingTeam] = useState<'home' | 'visitor' | null>(null);

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
    const existingScore = isHomeTeam ? homeScore : visitorScore;

    if (!runsStr && existingScore === undefined) return;
    if (runsStr === String(existingScore)) return;
    if (!runsStr) return;

    const runs = parseInt(runsStr, 10);
    if (isNaN(runs) || runs < 0 || runs > 99) return;
    if (existingScore === runs) return;

    setSubmittingTeam(isHomeTeam ? 'home' : 'visitor');
    await submitScore(gameId, {
      inningNumber: inning,
      isHomeTeam,
      runs,
    });
    setSubmittingTeam(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        Enter Runs for Inning {inning}:
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
            disabled={disabled || submittingTeam === 'visitor'}
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
            disabled={disabled || submittingTeam === 'home'}
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
  );
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
    onSessionStarted,
    onInningAdvanced,
  } = useBaseballLiveScoring();

  const {
    isLoading,
    error: operationError,
    startSession,
    advanceInning,
    finalizeSession,
    stopSession,
    clearError,
  } = useBaseballLiveScoringOperations();

  const [userSelectedInning, setUserSelectedInning] = useState<number | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmColor: 'error' | 'primary' | 'success';
  } | null>(null);

  // Derive effective inning: user selection takes precedence, falls back to server state
  const effectiveInning = userSelectedInning ?? sessionState?.currentInning ?? 1;

  useEffect(() => {
    if (hasActiveSession) {
      connect(gameId, 'scorer');
    }
    return () => {
      disconnect();
    };
  }, [gameId, hasActiveSession, connect, disconnect]);

  // Subscribe to session start event to clear loading state
  useEffect(() => {
    return onSessionStarted(() => {
      setStartingSession(false);
    });
  }, [onSessionStarted]);

  // Subscribe to inning advance events to follow server
  useEffect(() => {
    return onInningAdvanced(() => {
      setUserSelectedInning(null);
    });
  }, [onInningAdvanced]);

  const getScoreForInning = useCallback(
    (inning: number, isHomeTeam: boolean): number | undefined => {
      const score = sessionState?.scores.find(
        (s) => s.inningNumber === inning && s.isHomeTeam === isHomeTeam,
      );
      return score?.runs;
    },
    [sessionState?.scores],
  );

  // Generate key for InningScoreEntry to reset form when inning or scores change
  const scoreEntryKey = useMemo(() => {
    const homeScore = getScoreForInning(effectiveInning, true);
    const visitorScore = getScoreForInning(effectiveInning, false);
    return `${effectiveInning}-${homeScore ?? 'null'}-${visitorScore ?? 'null'}`;
  }, [effectiveInning, getScoreForInning]);

  const handleStartSession = useCallback(async () => {
    setStartingSession(true);
    const result = await startSession(gameId);
    if (result) {
      connect(gameId);
    } else {
      setStartingSession(false);
    }
  }, [gameId, startSession, connect]);

  const handleAdvanceInning = async (direction: 'prev' | 'next') => {
    const newInning = direction === 'next' ? effectiveInning + 1 : effectiveInning - 1;
    if (newInning < 1 || newInning > 99) return;

    setUserSelectedInning(newInning);
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
  const displayInnings = Math.max(effectiveInning, maxInning, 1);
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
                disabled={effectiveInning <= 1 || isSessionFinalized}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h5" sx={{ minWidth: 120, textAlign: 'center' }}>
                Inning {effectiveInning}
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
                          bgcolor: inning === effectiveInning ? 'primary.light' : undefined,
                          color: inning === effectiveInning ? 'primary.contrastText' : undefined,
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
                            bgcolor: inning === effectiveInning ? 'primary.light' : undefined,
                            color: inning === effectiveInning ? 'primary.contrastText' : undefined,
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
                            bgcolor: inning === effectiveInning ? 'primary.light' : undefined,
                            color: inning === effectiveInning ? 'primary.contrastText' : undefined,
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
              <InningScoreEntry
                key={scoreEntryKey}
                inning={effectiveInning}
                homeScore={getScoreForInning(effectiveInning, true)}
                visitorScore={getScoreForInning(effectiveInning, false)}
                homeTeamName={homeTeamName}
                visitorTeamName={visitorTeamName}
                gameId={gameId}
                disabled={isSessionFinalized}
              />
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
