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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  useIndividualLiveScoring,
  IndividualLiveScoringProvider,
} from '../../../context/IndividualLiveScoringContext';
import { getGolfCourse } from '@draco/shared-api-client';
import type { GolfCourseWithTees } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import ScorecardTable from '../ScorecardTable';

interface IndividualLiveWatchDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

function IndividualLiveWatchDialogContent({
  accountId,
  onClose,
}: Omit<IndividualLiveWatchDialogProps, 'open'>) {
  const apiClient = useApiClient();
  const {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    connect,
    disconnect,
  } = useIndividualLiveScoring();
  const [courseData, setCourseData] = useState<GolfCourseWithTees | null>(null);

  useEffect(() => {
    connect(accountId);
    return () => {
      disconnect();
    };
  }, [accountId, connect, disconnect]);

  useEffect(() => {
    if (!sessionState?.courseId) return;

    const fetchCourseData = async () => {
      const result = await getGolfCourse({
        client: apiClient,
        path: { accountId, courseId: sessionState.courseId },
        throwOnError: false,
      });
      if (result.data) {
        setCourseData(result.data);
      }
    };

    fetchCourseData();
  }, [sessionState?.courseId, apiClient, accountId]);

  const isSessionActive = sessionState?.status === 'active';
  const isSessionFinalized = sessionState?.status === 'finalized';
  const isSessionStopped = sessionState?.status === 'stopped';

  const playerScores = useMemo(() => {
    if (!sessionState) return [];

    const holeScores = Array(sessionState.holesPlayed).fill(0);
    sessionState.scores.forEach((s) => {
      holeScores[s.holeNumber - 1] = s.score;
    });

    return [
      {
        playerName: 'Score',
        holeScores,
        totalScore: sessionState.scores.reduce((sum, s) => sum + s.score, 0),
      },
    ];
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
          {isSessionFinalized && <Chip label="Completed" size="small" color="success" />}
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
                <Button color="inherit" size="small" onClick={() => connect(accountId)}>
                  Retry
                </Button>
              ) : undefined
            }
          >
            {connectionError}
          </Alert>
        )}

        {(isConnecting || (!sessionState && !connectionError)) && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Connecting to live session...
            </Typography>
          </Box>
        )}

        {sessionState && (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {sessionState.courseName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {sessionState.teeName} - {new Date(sessionState.datePlayed).toLocaleDateString()}
              </Typography>
              {isSessionActive && (
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  Currently on Hole {sessionState.currentHole}
                </Typography>
              )}
            </Box>

            {courseData ? (
              <ScorecardTable
                pars={courseData.mensPar}
                handicaps={courseData.mensHandicap}
                playerScores={playerScores}
                holesPlayed={sessionState.holesPlayed as 9 | 18}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {(isConnecting || (!sessionState && !connectionError)) && (
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

export default function IndividualLiveWatchDialog(props: IndividualLiveWatchDialogProps) {
  const { open, onClose, ...contentProps } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <IndividualLiveScoringProvider>
        <IndividualLiveWatchDialogContent {...contentProps} onClose={onClose} />
      </IndividualLiveScoringProvider>
    </Dialog>
  );
}
