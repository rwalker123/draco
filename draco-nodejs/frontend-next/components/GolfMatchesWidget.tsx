'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Divider, Button } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {
  listGolfMatchesForSeason,
  getGolfTeamWithRoster,
  calculateBatchCourseHandicaps,
} from '@draco/shared-api-client';
import type {
  GolfMatch,
  GolfTeamWithRoster,
  BatchCourseHandicapResponse,
} from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import WidgetShell from './ui/WidgetShell';
import GameCard, { GameCardData } from './GameCard';
import { useAccountTimezone } from '../context/AccountContext';
import { useAuth } from '../context/AuthContext';
import GolfScorecardDialog from './golf/GolfScorecardDialog';
import LiveScoringDialog from './golf/live-scoring/LiveScoringDialog';
import { AccountOptional } from './account/AccountOptional';
import { useLiveScoringOperations } from '../hooks/useLiveScoringOperations';
import { formatDateInTimezone } from '../utils/dateUtils';

interface GolfMatchesWidgetProps {
  accountId: string;
  seasonId: string;
  title?: string;
}

export default function GolfMatchesWidget({
  accountId,
  seasonId,
  title = 'Matches',
}: GolfMatchesWidgetProps) {
  const apiClient = useApiClient();
  const timeZone = useAccountTimezone();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [recentMatches, setRecentMatches] = useState<GolfMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<GolfMatch[]>([]);
  const [teams, setTeams] = useState<Map<string, GolfTeamWithRoster>>(new Map());
  const [courseHandicaps, setCourseHandicaps] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [liveScoringMatchId, setLiveScoringMatchId] = useState<string | null>(null);
  const [watchingMatchId, setWatchingMatchId] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<Set<string>>(new Set());

  const currentContactId = user?.contact?.id;

  const { getActiveSessions } = useLiveScoringOperations();

  const isMatchToday = useCallback(
    (matchDate: string): boolean => {
      const matchDay = formatDateInTimezone(matchDate, timeZone, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const today = formatDateInTimezone(new Date().toISOString(), timeZone, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return matchDay === today;
    },
    [timeZone],
  );

  const loadActiveSessions = useCallback(async () => {
    const sessions = await getActiveSessions(accountId);
    if (sessions) {
      setActiveSessions(new Set(sessions.map((s) => s.matchId)));
    }
  }, [getActiveSessions, accountId]);

  const loadMatches = useCallback(async () => {
    if (!seasonId || seasonId === '0') return;

    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);

      const matchesResult = await listGolfMatchesForSeason({
        client: apiClient,
        path: { accountId, seasonId },
        query: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        throwOnError: false,
      });

      const matches = unwrapApiResult<GolfMatch[]>(matchesResult, 'Failed to load matches');

      const uniqueTeamIds = new Set<string>();
      matches.forEach((match) => {
        uniqueTeamIds.add(match.team1.id);
        uniqueTeamIds.add(match.team2.id);
      });

      const teamPromises = Array.from(uniqueTeamIds).map((teamSeasonId) =>
        getGolfTeamWithRoster({
          client: apiClient,
          path: { accountId, seasonId, teamSeasonId },
          throwOnError: false,
        }),
      );

      const teamResults = await Promise.all(teamPromises);
      const teamsMap = new Map<string, GolfTeamWithRoster>();
      teamResults.forEach((result) => {
        if (result.data) {
          teamsMap.set(result.data.id, result.data);
        }
      });
      setTeams(teamsMap);

      const handicapsMap = new Map<string, number>();
      const matchesWithTees = matches.filter((m) => m.tee?.id);

      for (const match of matchesWithTees) {
        if (!match.tee?.id) continue;

        const team1 = teamsMap.get(match.team1.id);
        const team2 = teamsMap.get(match.team2.id);

        const golferIds: string[] = [];
        if (team1?.playerCount === 1 && team1.roster[0]) {
          golferIds.push(team1.roster[0].golferId);
        }
        if (team2?.playerCount === 1 && team2.roster[0]) {
          golferIds.push(team2.roster[0].golferId);
        }

        if (golferIds.length > 0) {
          const handicapResult = await calculateBatchCourseHandicaps({
            client: apiClient,
            path: { accountId },
            body: {
              golferIds,
              teeId: match.tee.id,
              holesPlayed: 18,
            },
            throwOnError: false,
          });

          if (handicapResult.data) {
            const response = handicapResult.data as BatchCourseHandicapResponse;
            response.players.forEach((player) => {
              if (player.courseHandicap !== null) {
                const key = `${match.id}-${player.golferId}`;
                handicapsMap.set(key, player.courseHandicap);
              }
            });
          }
        }
      }
      setCourseHandicaps(handicapsMap);

      const now = new Date();
      const MATCH_STATUS_COMPLETED = 1;

      const recent = matches
        .filter((m) => m.matchStatus === MATCH_STATUS_COMPLETED || new Date(m.matchDateTime) < now)
        .sort((a, b) => new Date(b.matchDateTime).getTime() - new Date(a.matchDateTime).getTime());

      const upcoming = matches
        .filter((m) => m.matchStatus !== MATCH_STATUS_COMPLETED && new Date(m.matchDateTime) >= now)
        .sort((a, b) => new Date(a.matchDateTime).getTime() - new Date(b.matchDateTime).getTime());

      setRecentMatches(recent.slice(0, 5));
      setUpcomingMatches(upcoming.slice(0, 5));
    } catch (err) {
      console.error('Error loading golf matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, seasonId]);

  useEffect(() => {
    loadMatches();
    loadActiveSessions();
  }, [loadMatches, loadActiveSessions]);

  const getTeamName = (teamId: string, teamName: string | undefined): string => {
    const team = teams.get(teamId);
    return teamName ?? team?.name ?? 'Unknown Team';
  };

  const getTeamCourseHandicap = (teamId: string, matchId: string): number | undefined => {
    const team = teams.get(teamId);
    if (team?.playerCount === 1 && team.roster[0]) {
      const key = `${matchId}-${team.roster[0].golferId}`;
      return courseHandicaps.get(key);
    }
    return undefined;
  };

  const handleMatchClick = (game: GameCardData) => {
    if (!isAuthenticated) return;
    setSelectedMatchId(game.id);
  };

  const handleScorecardClose = () => {
    setSelectedMatchId(null);
  };

  const handleLiveScoringClick = (matchId: string) => {
    setLiveScoringMatchId(matchId);
  };

  const handleLiveScoringClose = () => {
    setLiveScoringMatchId(null);
    loadActiveSessions();
    loadMatches();
  };

  const handleWatchClick = (matchId: string) => {
    setWatchingMatchId(matchId);
  };

  const handleWatchClose = () => {
    setWatchingMatchId(null);
    loadActiveSessions();
    loadMatches();
  };

  const isUserParticipant = useCallback(
    (match: GolfMatch): boolean => {
      if (!currentContactId) return false;
      const team1 = teams.get(match.team1.id);
      const team2 = teams.get(match.team2.id);
      const allRoster = [...(team1?.roster || []), ...(team2?.roster || [])];
      return allRoster.some((entry) => entry.player.id === currentContactId);
    },
    [currentContactId, teams],
  );

  const getWatchingMatch = (): GolfMatch | undefined => {
    if (!watchingMatchId) return undefined;
    return [...recentMatches, ...upcomingMatches].find((m) => m.id === watchingMatchId);
  };

  const getLiveScoringMatch = (): GolfMatch | undefined => {
    if (!liveScoringMatchId) return undefined;
    return [...recentMatches, ...upcomingMatches].find((m) => m.id === liveScoringMatchId);
  };

  const mapMatchToGameCardData = (match: GolfMatch): GameCardData => {
    return {
      id: match.id,
      date: match.matchDateTime,
      homeTeamId: match.team1.id,
      visitorTeamId: match.team2.id,
      homeTeamName: getTeamName(match.team1.id, match.team1.name),
      visitorTeamName: getTeamName(match.team2.id, match.team2.name),
      homeScore: match.team1TotalScore ?? 0,
      visitorScore: match.team2TotalScore ?? 0,
      gameStatus: match.matchStatus,
      gameStatusText: getMatchStatusText(match.matchStatus),
      gameStatusShortText: getMatchStatusShortText(match.matchStatus),
      leagueName: '',
      fieldId: match.course?.id ?? null,
      fieldName: match.course?.name ?? null,
      fieldShortName: match.course?.name ?? null,
      hasGameRecap: false,
      gameRecaps: [],
      comment: match.comment ?? '',
      gameType: match.matchType,
      golfExtras: {
        homeNetScore: match.team1NetScore,
        visitorNetScore: match.team2NetScore,
        homePoints: match.team1Points,
        visitorPoints: match.team2Points,
        homeCourseHandicap: getTeamCourseHandicap(match.team1.id, match.id),
        visitorCourseHandicap: getTeamCourseHandicap(match.team2.id, match.id),
      },
    };
  };

  const renderMatchSection = (sectionTitle: string, matches: GolfMatch[], emptyMessage: string) => (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          mb: 1.5,
          fontWeight: 600,
        }}
      >
        {sectionTitle}
      </Typography>
      {matches.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {emptyMessage}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {matches.map((match) => {
            const hasActiveSession = activeSessions.has(match.id);
            const showLiveButton = isMatchToday(match.matchDateTime) && match.matchStatus === 0;
            const isParticipant = isUserParticipant(match);

            return (
              <Box key={match.id}>
                <GameCard
                  game={mapMatchToGameCardData(match)}
                  layout="horizontal"
                  canEditGames={false}
                  timeZone={timeZone}
                  onClick={handleMatchClick}
                />
                {isAuthenticated && hasActiveSession && isParticipant && (
                  <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
                      onClick={() => handleLiveScoringClick(match.id)}
                      sx={{
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.7 },
                          '100%': { opacity: 1 },
                        },
                      }}
                    >
                      LIVE - Join Session
                    </Button>
                  </Box>
                )}
                {isAuthenticated && hasActiveSession && !isParticipant && (
                  <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<FiberManualRecordIcon sx={{ fontSize: 12 }} />}
                      onClick={() => handleWatchClick(match.id)}
                      sx={{
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.7 },
                          '100%': { opacity: 1 },
                        },
                      }}
                    >
                      LIVE - Watch
                    </Button>
                  </Box>
                )}
                {isAuthenticated && !hasActiveSession && showLiveButton && (
                  <AccountOptional accountId={accountId} componentId="liveScoring.startButton">
                    <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlayCircleOutlineIcon />}
                        onClick={() => handleLiveScoringClick(match.id)}
                      >
                        Start Live Scoring
                      </Button>
                    </Box>
                  </AccountOptional>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );

  const renderBody = () => {
    if (!seasonId || seasonId === '0') {
      return (
        <Typography variant="body2" color="text.secondary">
          Please select a season to view matches.
        </Typography>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
          <CircularProgress size={30} />
        </Box>
      );
    }

    if (recentMatches.length === 0 && upcomingMatches.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No matches scheduled for this period.
        </Typography>
      );
    }

    return (
      <Box>
        {upcomingMatches.length > 0 &&
          renderMatchSection('Upcoming', upcomingMatches, 'No upcoming matches')}
        {upcomingMatches.length > 0 && recentMatches.length > 0 && <Divider sx={{ my: 2 }} />}
        {recentMatches.length > 0 &&
          renderMatchSection('Recent Results', recentMatches, 'No recent results')}
      </Box>
    );
  };

  return (
    <>
      <WidgetShell
        title={
          <Typography variant="h6" fontWeight={700} color="text.primary">
            {title}
          </Typography>
        }
        accent="primary"
      >
        {renderBody()}
      </WidgetShell>
      {selectedMatchId && (
        <GolfScorecardDialog
          open={!!selectedMatchId}
          onClose={handleScorecardClose}
          matchId={selectedMatchId}
          accountId={accountId}
        />
      )}
      {liveScoringMatchId && getLiveScoringMatch() && (
        <LiveScoringDialog
          open={!!liveScoringMatchId}
          onClose={handleLiveScoringClose}
          matchId={liveScoringMatchId}
          accountId={accountId}
          seasonId={seasonId}
          team1Id={getLiveScoringMatch()!.team1.id}
          team2Id={getLiveScoringMatch()!.team2.id}
          hasActiveSession={activeSessions.has(liveScoringMatchId)}
        />
      )}
      {watchingMatchId && getWatchingMatch() && (
        <GolfScorecardDialog
          open={!!watchingMatchId}
          onClose={handleWatchClose}
          matchId={watchingMatchId}
          accountId={accountId}
          isLiveSession={true}
          seasonId={seasonId}
          team1Id={getWatchingMatch()!.team1.id}
          team2Id={getWatchingMatch()!.team2.id}
        />
      )}
    </>
  );
}

function getMatchStatusText(status: number): string {
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
}

function getMatchStatusShortText(status: number): string {
  switch (status) {
    case 0:
      return 'Sched';
    case 1:
      return 'Final';
    case 2:
      return 'Rain';
    case 3:
      return 'Ppd';
    case 4:
      return 'Forf';
    default:
      return '?';
  }
}
