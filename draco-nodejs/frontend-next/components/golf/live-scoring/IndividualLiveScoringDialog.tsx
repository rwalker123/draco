'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  useIndividualLiveScoring,
  IndividualLiveScoringProvider,
} from '../../../context/IndividualLiveScoringContext';
import { useIndividualLiveScoringOperations } from '../../../hooks/useIndividualLiveScoringOperations';

interface IndividualLiveScoringDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  hasActiveSession?: boolean;
  onSessionEnded?: () => void;
}

function IndividualLiveScoringDialogContent({
  accountId,
  hasActiveSession,
  onClose,
  onSessionEnded,
}: Omit<IndividualLiveScoringDialogProps, 'open'>) {
  const {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    connect,
    disconnect,
  } = useIndividualLiveScoring();

  const {
    isLoading,
    error: operationError,
    submitScore,
    advanceHole,
    finalizeSession,
    stopSession,
    clearError,
  } = useIndividualLiveScoringOperations();

  const [currentHoleOverride, setCurrentHoleOverride] = useState<number | null>(null);
  const [selectedScoreOverride, setSelectedScoreOverride] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const prevSessionIdRef = useRef<string | undefined>(undefined);

  const currentSessionId = sessionState?.sessionId;
  if (currentSessionId !== prevSessionIdRef.current) {
    prevSessionIdRef.current = currentSessionId;
    if (currentHoleOverride !== null) {
      setCurrentHoleOverride(null);
    }
    if (selectedScoreOverride !== null) {
      setSelectedScoreOverride(null);
    }
  }

  const currentHole = currentHoleOverride ?? sessionState?.currentHole ?? 1;

  const selectedScore = useMemo(() => {
    if (selectedScoreOverride !== null) return selectedScoreOverride;
    if (!sessionState) return null;
    const existingScore = sessionState.scores.find((s) => s.holeNumber === currentHole);
    return existingScore?.score ?? null;
  }, [selectedScoreOverride, sessionState, currentHole]);
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
      connect(accountId);
    }
    return () => {
      disconnect();
    };
  }, [accountId, hasActiveSession, connect, disconnect]);

  const handleScoreSelect = useCallback(
    async (score: number) => {
      const existingScore = sessionState?.scores.find((s) => s.holeNumber === currentHole)?.score;

      if (score === existingScore) {
        setSelectedScoreOverride(score);
        return;
      }

      setSelectedScoreOverride(score);
      setSubmitting(true);

      const result = await submitScore(accountId, {
        holeNumber: currentHole,
        score,
      });

      setSubmitting(false);

      if (!result) {
        setSelectedScoreOverride(existingScore ?? null);
      } else {
        setSelectedScoreOverride(null);
      }
    },
    [accountId, currentHole, sessionState, submitScore],
  );

  const handleAdvanceHole = useCallback(
    async (direction: 'prev' | 'next') => {
      const holesPlayed = sessionState?.holesPlayed ?? 18;
      const newHole = direction === 'next' ? currentHole + 1 : currentHole - 1;
      if (newHole < 1 || newHole > holesPlayed) return;

      setCurrentHoleOverride(newHole);
      setSelectedScoreOverride(null);
      await advanceHole(accountId, newHole);
    },
    [accountId, currentHole, sessionState?.holesPlayed, advanceHole],
  );

  const handleFinalize = () => {
    setConfirmDialog({
      open: true,
      title: 'Finalize Round',
      message:
        'Are you sure you want to finalize this round? This will save your scores permanently.',
      confirmText: 'Save Round',
      confirmColor: 'success',
      onConfirm: async () => {
        setConfirmDialog(null);
        const success = await finalizeSession(accountId);
        if (success) {
          onSessionEnded?.();
          onClose();
        }
      },
    });
  };

  const handleStop = () => {
    setConfirmDialog({
      open: true,
      title: 'Stop Round',
      message: 'Are you sure you want to stop this round? Your scores will NOT be saved.',
      confirmText: 'Stop Round',
      confirmColor: 'error',
      onConfirm: async () => {
        setConfirmDialog(null);
        const success = await stopSession(accountId);
        if (success) {
          onSessionEnded?.();
          onClose();
        }
      },
    });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog(null);
  };

  const isSessionActive = sessionState?.status === 'active';
  const isSessionFinalized = sessionState?.status === 'finalized';
  const totalScore = sessionState?.scores.reduce((sum, s) => sum + s.score, 0) ?? 0;
  const completedHoles = sessionState?.scores.length ?? 0;

  const scoreButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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
                <Button color="inherit" size="small" onClick={() => connect(accountId)}>
                  Retry
                </Button>
              ) : undefined
            }
          >
            {connectionError || operationError}
          </Alert>
        )}

        {(isConnecting || (hasActiveSession && !sessionState && !connectionError)) && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Connecting to live session...
            </Typography>
          </Box>
        )}

        {sessionState && (
          <>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {sessionState.courseName} - {sessionState.teeName}
              </Typography>
            </Box>

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
                disabled={currentHole <= 1 || isSessionFinalized || isLoading}
                size="large"
              >
                <ChevronLeftIcon fontSize="large" />
              </IconButton>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold">
                  {currentHole}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  of {sessionState.holesPlayed} holes
                </Typography>
              </Box>
              <IconButton
                onClick={() => handleAdvanceHole('next')}
                disabled={
                  currentHole >= sessionState.holesPlayed || isSessionFinalized || isLoading
                }
                size="large"
              >
                <ChevronRightIcon fontSize="large" />
              </IconButton>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" textAlign="center" sx={{ mb: 2 }}>
                Select Score
              </Typography>
              <Grid container spacing={1} justifyContent="center">
                {scoreButtons.map((score) => (
                  <Grid key={score} size={{ xs: 3, sm: 2 }}>
                    <Button
                      variant={selectedScore === score ? 'contained' : 'outlined'}
                      onClick={() => handleScoreSelect(score)}
                      disabled={isSessionFinalized || submitting}
                      fullWidth
                      sx={{
                        minHeight: 50,
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {score}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Holes Completed
                </Typography>
                <Typography variant="h6">{completedHoles}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Running Total
                </Typography>
                <Typography variant="h6">{totalScore}</Typography>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {(isConnecting || (hasActiveSession && !sessionState && !connectionError)) && (
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
              Stop Round
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleFinalize}
              disabled={isLoading}
            >
              Save Round
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

      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export default function IndividualLiveScoringDialog(props: IndividualLiveScoringDialogProps) {
  const { open, onClose, ...contentProps } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <IndividualLiveScoringProvider>
        <IndividualLiveScoringDialogContent {...contentProps} onClose={onClose} />
      </IndividualLiveScoringProvider>
    </Dialog>
  );
}
