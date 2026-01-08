'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  Close as CloseIcon,
  FiberManualRecord as FiberManualRecordIcon,
} from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  getGolfMatchWithScores,
  getGolfCourse,
  getGolfTeamWithRoster,
} from '@draco/shared-api-client';
import type {
  GolfMatchWithScores,
  GolfCourseWithTees,
  LiveHoleScore,
  GolfTeamWithRoster,
} from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '../../utils/apiResult';
import { formatDateTimeInTimezone } from '../../utils/dateUtils';
import { useAccountTimezone } from '../../context/AccountContext';
import { LiveScoringProvider, useLiveScoring } from '../../context/LiveScoringContext';
import ScorecardTable from './ScorecardTable';

interface GolfScorecardDialogProps {
  open: boolean;
  onClose: () => void;
  matchId: string;
  accountId: string;
  isLiveSession?: boolean;
  seasonId?: string;
  team1Id?: string;
  team2Id?: string;
}

interface LiveScoringData {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  sessionState: { status: string; scores: LiveHoleScore[]; holesPlayed: number } | null;
  viewerCount: number;
  onSessionFinalized: (callback: (event: unknown) => void) => () => void;
  onSessionStopped: (callback: (event: unknown) => void) => () => void;
}

interface GolfScorecardDialogContentProps {
  onClose: () => void;
  matchId: string;
  accountId: string;
  liveData?: LiveScoringData;
  seasonId?: string;
  team1Id?: string;
  team2Id?: string;
}

function GolfScorecardDialogContent({
  onClose,
  matchId,
  accountId,
  liveData,
  seasonId,
  team1Id,
  team2Id,
}: GolfScorecardDialogContentProps) {
  const apiClient = useApiClient();
  const timeZone = useAccountTimezone();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<GolfMatchWithScores | null>(null);
  const [courseData, setCourseData] = useState<GolfCourseWithTees | null>(null);
  const [team1Roster, setTeam1Roster] = useState<GolfTeamWithRoster | null>(null);
  const [team2Roster, setTeam2Roster] = useState<GolfTeamWithRoster | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const isSessionActive = liveData?.sessionState?.status === 'active';
  const isLiveMode = !!liveData;

  const loadData = useCallback(async () => {
    if (!matchId) return;

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

      if (isLiveMode && seasonId && team1Id && team2Id) {
        setRosterError(null);
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

        if (team1Result.data) {
          setTeam1Roster(team1Result.data);
        }
        if (team2Result.data) {
          setTeam2Roster(team2Result.data);
        }

        if (team1Result.error || team2Result.error) {
          const errorStatus =
            (team1Result.error as { status?: number })?.status ||
            (team2Result.error as { status?: number })?.status;
          if (errorStatus === 403) {
            setRosterError('Unable to load player roster (access denied)');
          } else {
            setRosterError('Unable to load player roster');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load scorecard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, matchId, isLiveMode, seasonId, team1Id, team2Id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!liveData) return;

    const unsubFinalized = liveData.onSessionFinalized(() => {
      loadData();
    });

    const unsubStopped = liveData.onSessionStopped(() => {
      loadData();
    });

    return () => {
      unsubFinalized();
      unsubStopped();
    };
  }, [liveData, loadData]);

  const holesPlayedCount = useMemo(() => {
    if (liveData?.sessionState?.holesPlayed) {
      return liveData.sessionState.holesPlayed;
    }
    const allScores = [...(matchData?.team1Scores || []), ...(matchData?.team2Scores || [])];
    if (allScores.length > 0) {
      return allScores[0].holesPlayed || 18;
    }
    return 18;
  }, [matchData, liveData?.sessionState?.holesPlayed]);

  const playerScores = useMemo(() => {
    if (!matchData) return [];

    const allScores = [...(matchData.team1Scores || []), ...(matchData.team2Scores || [])];

    if (allScores.length > 0) {
      return allScores.map((score) => {
        const baseHoleScores = [...(score.holeScores || Array(holesPlayedCount).fill(0))];

        if (liveData?.sessionState?.scores) {
          liveData.sessionState.scores
            .filter((liveScore: LiveHoleScore) => liveScore.golferId === score.golferId)
            .forEach((liveScore: LiveHoleScore) => {
              baseHoleScores[liveScore.holeNumber - 1] = liveScore.score;
            });
        }

        const totalScore = baseHoleScores.reduce((sum, s) => sum + (s || 0), 0);

        return {
          playerName: score.player
            ? `${score.player.firstName} ${score.player.lastName}`
            : 'Unknown Player',
          holeScores: baseHoleScores,
          totalScore,
          handicapIndex: score.player?.handicapIndex,
          courseHandicap: score.courseHandicap,
          differential: score.differential,
          golferId: score.golferId,
          teamId: matchData.team1Scores?.some((s) => s.golferId === score.golferId)
            ? matchData.team1.id
            : matchData.team2.id,
        };
      });
    }

    if (isLiveMode && (team1Roster || team2Roster)) {
      const players: Array<{
        playerName: string;
        holeScores: number[];
        totalScore: number;
        handicapIndex?: number | null;
        courseHandicap?: number;
        differential?: number;
        golferId: string;
        teamId: string;
      }> = [];

      const team1Players = team1Roster?.roster || [];
      const team2Players = team2Roster?.roster || [];

      [...team1Players, ...team2Players].forEach((rosterEntry) => {
        const baseHoleScores = Array(holesPlayedCount).fill(0);

        if (liveData?.sessionState?.scores) {
          liveData.sessionState.scores
            .filter((liveScore: LiveHoleScore) => liveScore.golferId === rosterEntry.golferId)
            .forEach((liveScore: LiveHoleScore) => {
              baseHoleScores[liveScore.holeNumber - 1] = liveScore.score;
            });
        }

        const totalScore = baseHoleScores.reduce((sum, s) => sum + (s || 0), 0);

        players.push({
          playerName: `${rosterEntry.player.firstName} ${rosterEntry.player.lastName}`,
          holeScores: baseHoleScores,
          totalScore,
          handicapIndex: rosterEntry.player.handicapIndex,
          courseHandicap: undefined,
          differential: undefined,
          golferId: rosterEntry.golferId,
          teamId: team1Players.includes(rosterEntry)
            ? team1Roster?.id || ''
            : team2Roster?.id || '',
        });
      });

      return players;
    }

    return [];
  }, [
    matchData,
    liveData?.sessionState?.scores,
    holesPlayedCount,
    isLiveMode,
    team1Roster,
    team2Roster,
  ]);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isSessionActive && liveData?.viewerCount !== undefined && liveData.viewerCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {liveData.viewerCount}
                </Typography>
              </Box>
            )}
            <Chip
              label={isSessionActive ? 'LIVE' : getMatchStatusText(matchData.matchStatus)}
              size="small"
              color={
                isSessionActive ? 'error' : matchData.matchStatus === 1 ? 'success' : 'default'
              }
              icon={isSessionActive ? <FiberManualRecordIcon sx={{ fontSize: 12 }} /> : undefined}
              sx={
                isSessionActive
                  ? {
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.7 },
                        '100%': { opacity: 1 },
                      },
                    }
                  : undefined
              }
            />
          </Box>
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
    const firstScore = allScores[0];
    const holesPlayed = (holesPlayedCount || 18) as 9 | 18;

    const matchTeeId = matchData.tee?.id;
    const scoreTee = firstScore?.tee;
    const teeWithDistances = scoreTee || courseData.tees?.find((t) => t.id === matchTeeId);
    const distances = teeWithDistances?.distances;

    if (playerScores.length === 0) {
      if (rosterError) {
        return (
          <ScorecardTable
            pars={courseData.mensPar}
            handicaps={courseData.mensHandicap}
            distances={distances}
            playerScores={[]}
            holesPlayed={holesPlayed}
            startIndex={firstScore?.startIndex || 0}
            emptyMessage={rosterError}
          />
        );
      }

      if (isLiveMode) {
        return (
          <ScorecardTable
            pars={courseData.mensPar}
            handicaps={courseData.mensHandicap}
            distances={distances}
            playerScores={[]}
            holesPlayed={holesPlayed}
            startIndex={firstScore?.startIndex || 0}
            emptyMessage="Waiting for players..."
          />
        );
      }
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No scores recorded for this match.
        </Typography>
      );
    }

    return (
      <ScorecardTable
        pars={courseData.mensPar}
        handicaps={courseData.mensHandicap}
        distances={distances}
        playerScores={playerScores}
        holesPlayed={holesPlayed}
        startIndex={firstScore?.startIndex || 0}
      />
    );
  };

  const liveTeamTotals = useMemo(() => {
    if (!isSessionActive || !matchData) return null;

    let team1Total = 0;
    let team2Total = 0;

    const team1Id = team1Roster?.id || matchData.team1.id;
    const team2Id = team2Roster?.id || matchData.team2.id;

    playerScores.forEach((ps) => {
      if ('teamId' in ps) {
        if (ps.teamId === team1Id) {
          team1Total += ps.totalScore;
        } else if (ps.teamId === team2Id) {
          team2Total += ps.totalScore;
        }
      }
    });

    return { team1Total, team2Total };
  }, [isSessionActive, matchData, playerScores, team1Roster, team2Roster]);

  const renderTeamSummary = () => {
    if (!matchData) return null;

    const team1Score =
      isSessionActive && liveTeamTotals ? liveTeamTotals.team1Total : matchData.team1TotalScore;
    const team2Score =
      isSessionActive && liveTeamTotals ? liveTeamTotals.team2Total : matchData.team2TotalScore;

    const hasScores = team1Score !== undefined || team2Score !== undefined || isSessionActive;
    if (!hasScores) return null;

    const team1Won =
      !isSessionActive &&
      matchData.team1Points !== undefined &&
      matchData.team2Points !== undefined &&
      matchData.team1Points > matchData.team2Points;
    const team2Won =
      !isSessionActive &&
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
            {team1Score ?? '-'}
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
            {team2Score ?? '-'}
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
    <>
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
    </>
  );
}

interface LiveScorecardWrapperProps {
  onClose: () => void;
  matchId: string;
  accountId: string;
  seasonId?: string;
  team1Id?: string;
  team2Id?: string;
}

function LiveScorecardWrapper({
  onClose,
  matchId,
  accountId,
  seasonId,
  team1Id,
  team2Id,
}: LiveScorecardWrapperProps) {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    onSessionFinalized,
    onSessionStopped,
  } = useLiveScoring();

  useEffect(() => {
    connect(matchId);
    return () => {
      disconnect();
    };
  }, [matchId, connect, disconnect]);

  const liveData: LiveScoringData = {
    isConnected,
    isConnecting,
    connectionError,
    sessionState,
    viewerCount,
    onSessionFinalized,
    onSessionStopped,
  };

  return (
    <GolfScorecardDialogContent
      onClose={onClose}
      matchId={matchId}
      accountId={accountId}
      liveData={liveData}
      seasonId={seasonId}
      team1Id={team1Id}
      team2Id={team2Id}
    />
  );
}

export default function GolfScorecardDialog({
  open,
  onClose,
  matchId,
  accountId,
  isLiveSession = false,
  seasonId,
  team1Id,
  team2Id,
}: GolfScorecardDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  if (!open) return null;

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
      {isLiveSession ? (
        <LiveScoringProvider>
          <LiveScorecardWrapper
            onClose={onClose}
            matchId={matchId}
            accountId={accountId}
            seasonId={seasonId}
            team1Id={team1Id}
            team2Id={team2Id}
          />
        </LiveScoringProvider>
      ) : (
        <GolfScorecardDialogContent onClose={onClose} matchId={matchId} accountId={accountId} />
      )}
    </Dialog>
  );
}
