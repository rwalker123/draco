'use client';

import React from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import type { GolfScoreWithDetails } from '@draco/shared-api-client';

export interface GolfScoresListProps {
  scores: GolfScoreWithDetails[];
  contributingIndices?: Set<number>;
  showOwnerActions?: boolean;
  onEdit?: (score: GolfScoreWithDetails) => void;
  onDelete?: (score: GolfScoreWithDetails) => void;
  title?: string;
  emptyMessage?: string;
}

export default function GolfScoresList({
  scores,
  contributingIndices = new Set(),
  showOwnerActions = false,
  onEdit,
  onDelete,
  title = 'Recent Rounds',
  emptyMessage = 'No rounds recorded yet.',
}: GolfScoresListProps) {
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      {scores.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {scores.map((score, index) => (
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
              {showOwnerActions && (
                <Box sx={{ display: 'flex', ml: 1, gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => onEdit?.(score)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete?.(score)}
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
  );
}
