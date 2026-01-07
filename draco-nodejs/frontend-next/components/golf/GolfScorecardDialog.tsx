'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { getGolfMatchWithScores, getGolfCourse } from '@draco/shared-api-client';
import type { GolfMatchWithScores, GolfCourseWithTees } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import { formatDateTimeInTimezone } from '../../utils/dateUtils';
import { useAccountTimezone } from '../../context/AccountContext';
import ScorecardTable from './ScorecardTable';

interface GolfScorecardDialogProps {
  open: boolean;
  onClose: () => void;
  matchId: string;
  accountId: string;
}

export default function GolfScorecardDialog({
  open,
  onClose,
  matchId,
  accountId,
}: GolfScorecardDialogProps) {
  const apiClient = useApiClient();
  const timeZone = useAccountTimezone();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<GolfMatchWithScores | null>(null);
  const [courseData, setCourseData] = useState<GolfCourseWithTees | null>(null);

  const loadData = useCallback(async () => {
    if (!matchId || !open) return;

    setLoading(true);
    setError(null);

    try {
      const matchResult = await getGolfMatchWithScores({
        client: apiClient,
        path: { accountId, matchId },
        throwOnError: false,
      });

      const match = unwrapApiResult<GolfMatchWithScores>(matchResult, 'Failed to load match');
      setMatchData(match);

      if (match.course?.id) {
        const courseResult = await getGolfCourse({
          client: apiClient,
          path: { accountId, courseId: match.course.id },
          throwOnError: false,
        });
        const course = unwrapApiResult<GolfCourseWithTees>(courseResult, 'Failed to load course');
        setCourseData(course);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load scorecard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, matchId, open]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTeeColorHex = (teeColor: string): string => {
    const colorMap: Record<string, string> = {
      white: '#ffffff',
      black: '#000000',
      blue: '#0066cc',
      red: '#cc0000',
      gold: '#ffd700',
      green: '#008800',
      silver: '#c0c0c0',
      teal: '#008080',
      combo: '#9932cc',
    };
    return colorMap[teeColor.toLowerCase()] || '#888888';
  };

  const getMatchStatusText = (status: number): string => {
    switch (status) {
      case 0:
        return 'Scheduled';
      case 1:
        return 'Completed';
      case 2:
        return 'Rainout';
      case 3:
        return 'Postponed';
      case 4:
        return 'Forfeit';
      default:
        return 'Unknown';
    }
  };

  const renderHeader = () => {
    if (!matchData) return null;

    const tee = matchData.team1Scores?.[0]?.tee || matchData.team2Scores?.[0]?.tee;
    const formattedDate = formatDateTimeInTimezone(matchData.matchDateTime, timeZone);

    return (
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {formattedDate}
            </Typography>
            {matchData.course && (
              <Typography variant="h6" fontWeight={600}>
                {matchData.course.name}
              </Typography>
            )}
            {matchData.course?.city && matchData.course?.state && (
              <Typography variant="body2" color="text.secondary">
                {matchData.course.city}, {matchData.course.state}
              </Typography>
            )}
          </Box>
          <Chip
            label={getMatchStatusText(matchData.matchStatus)}
            size="small"
            color={matchData.matchStatus === 1 ? 'success' : 'default'}
          />
        </Box>
        {tee && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: getTeeColorHex(tee.teeColor),
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              <Typography variant="body2" fontWeight={500}>
                {tee.teeName}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Rating: {tee.mensRating} / Slope: {tee.mensSlope}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderScorecard = () => {
    if (!matchData || !courseData) return null;

    const allScores = [...(matchData.team1Scores || []), ...(matchData.team2Scores || [])];
    if (allScores.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No scores recorded for this match.
        </Typography>
      );
    }

    const firstScore = allScores[0];
    const holesPlayed = (firstScore.holesPlayed || 18) as 9 | 18;
    const tee = firstScore.tee;

    const playerScores = allScores.map((score) => ({
      playerName: score.player
        ? `${score.player.firstName} ${score.player.lastName}`
        : 'Unknown Player',
      holeScores: score.holeScores,
      totalScore: score.totalScore,
      handicapIndex: score.player?.handicapIndex,
    }));

    return (
      <ScorecardTable
        pars={courseData.mensPar}
        handicaps={courseData.mensHandicap}
        distances={tee?.distances}
        playerScores={playerScores}
        holesPlayed={holesPlayed}
        startIndex={firstScore.startIndex || 0}
      />
    );
  };

  const renderTeamSummary = () => {
    if (!matchData) return null;

    const hasScores =
      matchData.team1TotalScore !== undefined || matchData.team2TotalScore !== undefined;
    if (!hasScores) return null;

    const team1Won =
      matchData.team1Points !== undefined &&
      matchData.team2Points !== undefined &&
      matchData.team1Points > matchData.team2Points;
    const team2Won =
      matchData.team1Points !== undefined &&
      matchData.team2Points !== undefined &&
      matchData.team2Points > matchData.team1Points;

    return (
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Match Summary
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto auto',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Team
          </Typography>
          <Typography variant="body2" fontWeight={600} textAlign="center" sx={{ minWidth: 50 }}>
            Gross
          </Typography>
          <Typography variant="body2" fontWeight={600} textAlign="center" sx={{ minWidth: 50 }}>
            Net
          </Typography>
          <Typography variant="body2" fontWeight={600} textAlign="center" sx={{ minWidth: 50 }}>
            Points
          </Typography>
          <Box sx={{ width: 24 }} />

          <Typography
            variant="body2"
            fontWeight={team1Won ? 700 : 400}
            color={team1Won ? 'success.main' : 'text.primary'}
          >
            {matchData.team1.name}
          </Typography>
          <Typography variant="body2" textAlign="center">
            {matchData.team1TotalScore ?? '-'}
          </Typography>
          <Typography variant="body2" textAlign="center">
            {matchData.team1NetScore ?? '-'}
          </Typography>
          <Typography variant="body2" textAlign="center" fontWeight={600}>
            {matchData.team1Points ?? '-'}
          </Typography>
          <Box>{team1Won && <Typography color="success.main">✓</Typography>}</Box>

          <Typography
            variant="body2"
            fontWeight={team2Won ? 700 : 400}
            color={team2Won ? 'success.main' : 'text.primary'}
          >
            {matchData.team2.name}
          </Typography>
          <Typography variant="body2" textAlign="center">
            {matchData.team2TotalScore ?? '-'}
          </Typography>
          <Typography variant="body2" textAlign="center">
            {matchData.team2NetScore ?? '-'}
          </Typography>
          <Typography variant="body2" textAlign="center" fontWeight={600}>
            {matchData.team2Points ?? '-'}
          </Typography>
          <Box>{team2Won && <Typography color="success.main">✓</Typography>}</Box>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' },
      }}
    >
      <DialogTitle
        component="div"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="h6" fontWeight={700}>
          Scorecard
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && matchData && (
          <>
            {renderHeader()}
            {renderScorecard()}
            {renderTeamSummary()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
