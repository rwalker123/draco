'use client';

import React from 'react';
import { Paper, Box, Typography, Button, Chip, LinearProgress } from '@mui/material';
import {
  FiberManualRecord as LiveIcon,
  Visibility as ViewerIcon,
  PlayArrow as ContinueIcon,
  Tv as WatchIcon,
  GolfCourse as GolfCourseIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import type { IndividualLiveScoringState } from '../../../context/IndividualLiveScoringContext';

interface LiveRoundCardProps {
  session: IndividualLiveScoringState;
  isOwner: boolean;
  onContinue?: () => void;
  onWatch?: () => void;
  onCancel?: () => void;
}

export const LiveRoundCard: React.FC<LiveRoundCardProps> = ({
  session,
  isOwner,
  onContinue,
  onWatch,
  onCancel,
}) => {
  const completedHoles = session.scores.length;
  const progress = (completedHoles / session.holesPlayed) * 100;
  const totalScore = session.scores.reduce((sum, s) => sum + s.score, 0);

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
        color: 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={
              <LiveIcon sx={{ fontSize: 12, color: 'white', animation: 'pulse 2s infinite' }} />
            }
            label="LIVE"
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: 'white',
              },
            }}
          />
          <Typography variant="h6" fontWeight="bold">
            Live Round in Progress
          </Typography>
        </Box>
        {session.viewerCount !== undefined && session.viewerCount > 0 && (
          <Chip
            icon={<ViewerIcon sx={{ fontSize: 14, color: 'white' }} />}
            label={`${session.viewerCount} watching`}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '& .MuiChip-icon': {
                color: 'white',
              },
            }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GolfCourseIcon sx={{ fontSize: 20, opacity: 0.9 }} />
        <Typography variant="body1">
          {session.courseName} - {session.teeName}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Hole {session.currentHole} of {session.holesPlayed}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {completedHoles} holes completed
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'white',
            },
          }}
        />
      </Box>

      {totalScore > 0 && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          Running Total: <strong>{totalScore}</strong>
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {isOwner && onCancel && (
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Cancel Session
          </Button>
        )}
        {isOwner ? (
          <Button
            variant="contained"
            startIcon={<ContinueIcon />}
            onClick={onContinue}
            sx={{
              bgcolor: 'white',
              color: 'error.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            Continue Scoring
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<WatchIcon />}
            onClick={onWatch}
            sx={{
              bgcolor: 'white',
              color: 'error.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            Watch Live
          </Button>
        )}
      </Box>

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
    </Paper>
  );
};

export default LiveRoundCard;
