'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  useBaseballLiveScoring,
  BaseballLiveScoringProvider,
} from '../../../context/BaseballLiveScoringContext';
import { getBaseballLiveScoringState } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';

interface BaseballLiveWatchDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: string;
  accountId: string;
  homeTeamName: string;
  visitorTeamName: string;
}

function BaseballLiveWatchDialogContent({
  gameId,
  accountId,
  homeTeamName,
  visitorTeamName,
  onClose,
}: Omit<BaseballLiveWatchDialogProps, 'open'>) {
  const apiClient = useApiClient();
  const {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    connect,
    disconnect,
  } = useBaseballLiveScoring();
  const [loadingInitialState, setLoadingInitialState] = useState(true);
  const [noSession, setNoSession] = useState(false);

  useEffect(() => {
    const fetchInitialState = async () => {
      setLoadingInitialState(true);
      try {
        const result = await getBaseballLiveScoringState({
          client: apiClient,
          path: { accountId, gameId },
          throwOnError: false,
        });

        if (result.error || !result.data) {
          setNoSession(true);
        } else {
          connect(gameId, 'watcher');
        }
      } catch {
        setNoSession(true);
      } finally {
        setLoadingInitialState(false);
      }
    };

    fetchInitialState();

    return () => {
      disconnect();
    };
  }, [gameId, accountId, apiClient, connect, disconnect]);

  const isSessionActive = sessionState?.status === 'active';
  const isSessionFinalized = sessionState?.status === 'finalized';
  const isSessionStopped = sessionState?.status === 'stopped';

  const { inningsToShow, getScoreForInning } = useMemo(() => {
    if (!sessionState?.scores.length) {
      return {
        inningsToShow: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        getScoreForInning: () => undefined,
      };
    }

    const maxInning = Math.max(...sessionState.scores.map((s) => s.inningNumber), 9);
    const innings = Array.from({ length: maxInning }, (_, i) => i + 1);

    const getScore = (inning: number, isHomeTeam: boolean): number | undefined => {
      const score = sessionState.scores.find(
        (s) => s.inningNumber === inning && s.isHomeTeam === isHomeTeam,
      );
      return score?.runs;
    };

    return {
      inningsToShow: innings,
      getScoreForInning: getScore,
    };
  }, [sessionState]);

  return (
    <>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Watch Live</Typography>
          {isSessionActive && (
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
              label="LIVE"
              size="small"
              color="error"
              sx={{ animation: 'pulse 2s infinite' }}
            />
          )}
          {isSessionFinalized && <Chip label="Final" size="small" color="success" />}
          {isSessionStopped && <Chip label="Stopped" size="small" color="default" />}
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
        {connectionError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              !isConnecting ? (
                <Button color="inherit" size="small" onClick={() => connect(gameId, 'watcher')}>
                  Retry
                </Button>
              ) : undefined
            }
          >
            {connectionError}
          </Alert>
        )}

        {(isConnecting || loadingInitialState) && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Connecting to live session...
            </Typography>
          </Box>
        )}

        {sessionState && (
          <>
            {isSessionActive && sessionState.currentInning && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body1" color="primary">
                  Currently in Inning {sessionState.currentInning}
                </Typography>
              </Box>
            )}

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                    {inningsToShow.map((inning) => (
                      <TableCell
                        key={inning}
                        align="center"
                        sx={{
                          bgcolor:
                            isSessionActive && inning === sessionState.currentInning
                              ? 'primary.light'
                              : undefined,
                          color:
                            isSessionActive && inning === sessionState.currentInning
                              ? 'primary.contrastText'
                              : undefined,
                          fontWeight: 'bold',
                        }}
                      >
                        {inning}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      R
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                      {visitorTeamName}
                    </TableCell>
                    {inningsToShow.map((inning) => {
                      const runs = getScoreForInning(inning, false);
                      return (
                        <TableCell
                          key={inning}
                          align="center"
                          sx={{
                            bgcolor:
                              isSessionActive && inning === sessionState.currentInning
                                ? 'primary.light'
                                : undefined,
                            color:
                              isSessionActive && inning === sessionState.currentInning
                                ? 'primary.contrastText'
                                : undefined,
                          }}
                        >
                          {runs ?? '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {sessionState.visitorTeamTotal}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                      {homeTeamName}
                    </TableCell>
                    {inningsToShow.map((inning) => {
                      const runs = getScoreForInning(inning, true);
                      return (
                        <TableCell
                          key={inning}
                          align="center"
                          sx={{
                            bgcolor:
                              isSessionActive && inning === sessionState.currentInning
                                ? 'primary.light'
                                : undefined,
                            color:
                              isSessionActive && inning === sessionState.currentInning
                                ? 'primary.contrastText'
                                : undefined,
                          }}
                        >
                          {runs ?? '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {sessionState.homeTeamTotal}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {noSession && !loadingInitialState && !isConnecting && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No active live scoring session found for this game.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

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

export default function BaseballLiveWatchDialog(props: BaseballLiveWatchDialogProps) {
  const { open, onClose, ...contentProps } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <BaseballLiveScoringProvider>
        <BaseballLiveWatchDialogContent {...contentProps} onClose={onClose} />
      </BaseballLiveScoringProvider>
    </Dialog>
  );
}
