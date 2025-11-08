'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Breadcrumbs, Link as MuiLink, Snackbar, Typography } from '@mui/material';
import NextLink from 'next/link';
import {
  type GameAttendanceType,
  type GameBattingStatLineType,
  type GameBattingStatsType,
  type GamePitchingStatLineType,
  type GamePitchingStatsType,
  type CreateGameBattingStatType,
  type CreateGamePitchingStatType,
  type UpdateGameBattingStatType,
  type UpdateGamePitchingStatType,
  type PlayerBattingStatsType,
  type PlayerPitchingStatsType,
  type TeamCompletedGameType,
  type TeamStatsPlayerSummaryType,
} from '@draco/shared-schemas';

import { useAuth } from '../../../../../../../../context/AuthContext';
import { useRole } from '../../../../../../../../context/RoleContext';
import { useApiClient } from '../../../../../../../../hooks/useApiClient';
import { useAccountSettings } from '../../../../../../../../hooks/useAccountSettings';
import AccountPageHeader from '../../../../../../../../components/AccountPageHeader';
import TeamAvatar from '../../../../../../../../components/TeamAvatar';
import TeamInfoCard from '../../../../../../../../components/TeamInfoCard';
import { TeamStatsEntryService } from '../../../../../../../../services/teamStatsEntryService';
import GameListCard, {
  type SortOrder,
} from '../../../../../../../../components/team-stats-entry/GameListCard';
import StatsTabsCard, {
  type TabKey,
} from '../../../../../../../../components/team-stats-entry/StatsTabsCard';
import type {
  GameOutcome,
  StatsTabsCardHandle,
} from '../../../../../../../../components/team-stats-entry/types';
import AsyncConfirmDialog from '../../../../../../../../components/team-stats-entry/dialogs/AsyncConfirmDialog';
import { emptyAttendance } from '../../../../../../../../components/team-stats-entry/constants';

interface TeamStatEntryPageProps {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

type SnackbarState = {
  message: string;
  severity: 'success' | 'error';
} | null;

type CachedGameStats = {
  batting: GameBattingStatsType;
  pitching: GamePitchingStatsType;
  attendance: GameAttendanceType | null;
  attendanceSelection: string[];
};

const calculateBattingTotals = (
  stats: GameBattingStatLineType[],
): GameBattingStatsType['totals'] => {
  const totals = {
    ab: 0,
    h: 0,
    r: 0,
    d: 0,
    t: 0,
    hr: 0,
    rbi: 0,
    so: 0,
    bb: 0,
    hbp: 0,
    sb: 0,
    cs: 0,
    sf: 0,
    sh: 0,
    re: 0,
    intr: 0,
    lob: 0,
    tb: 0,
    pa: 0,
    avg: 0,
    obp: 0,
    slg: 0,
    ops: 0,
  };

  stats.forEach((line) => {
    totals.ab += line.ab ?? 0;
    totals.h += line.h ?? 0;
    totals.r += line.r ?? 0;
    totals.d += line.d ?? 0;
    totals.t += line.t ?? 0;
    totals.hr += line.hr ?? 0;
    totals.rbi += line.rbi ?? 0;
    totals.so += line.so ?? 0;
    totals.bb += line.bb ?? 0;
    totals.hbp += line.hbp ?? 0;
    totals.sb += line.sb ?? 0;
    totals.cs += line.cs ?? 0;
    totals.sf += line.sf ?? 0;
    totals.sh += line.sh ?? 0;
    totals.re += line.re ?? 0;
    totals.intr += line.intr ?? 0;
    totals.lob += line.lob ?? 0;
    totals.tb += line.tb ?? 0;
    totals.pa += line.pa ?? 0;
  });

  totals.avg = totals.ab > 0 ? totals.h / totals.ab : 0;
  const obpDenominator = totals.ab + totals.bb + totals.hbp + totals.sf;
  totals.obp = obpDenominator > 0 ? (totals.h + totals.bb + totals.hbp) / obpDenominator : 0;
  totals.slg = totals.ab > 0 ? totals.tb / totals.ab : 0;
  totals.ops = totals.obp + totals.slg;

  return totals;
};

const calculatePitchingTotals = (
  stats: GamePitchingStatLineType[],
): GamePitchingStatsType['totals'] => {
  const totals = {
    ipDecimal: 0,
    w: 0,
    l: 0,
    s: 0,
    h: 0,
    r: 0,
    er: 0,
    d: 0,
    t: 0,
    hr: 0,
    so: 0,
    bb: 0,
    bf: 0,
    wp: 0,
    hbp: 0,
    bk: 0,
    sc: 0,
    ip: 0,
    ip2: 0,
    era: 0,
    whip: 0,
    k9: 0,
    bb9: 0,
    oba: 0,
    slg: 0,
  };

  let totalOuts = 0;
  stats.forEach((line) => {
    totalOuts += line.ip * 3 + line.ip2;
    totals.w += line.w ?? 0;
    totals.l += line.l ?? 0;
    totals.s += line.s ?? 0;
    totals.h += line.h ?? 0;
    totals.r += line.r ?? 0;
    totals.er += line.er ?? 0;
    totals.d += line.d ?? 0;
    totals.t += line.t ?? 0;
    totals.hr += line.hr ?? 0;
    totals.so += line.so ?? 0;
    totals.bb += line.bb ?? 0;
    totals.bf += line.bf ?? 0;
    totals.wp += line.wp ?? 0;
    totals.hbp += line.hbp ?? 0;
    totals.bk += line.bk ?? 0;
    totals.sc += line.sc ?? 0;
  });

  const wholeInnings = Math.floor(totalOuts / 3);
  const remainingOuts = totalOuts - wholeInnings * 3;
  totals.ip = wholeInnings;
  totals.ip2 = remainingOuts;
  totals.ipDecimal = totals.ip + totals.ip2 / 10;

  const inningsForRates = totalOuts / 3;
  if (inningsForRates > 0) {
    totals.era = (totals.er * 9) / inningsForRates;
    totals.whip = (totals.bb + totals.h) / inningsForRates;
    totals.k9 = (totals.so * 9) / inningsForRates;
    totals.bb9 = (totals.bb * 9) / inningsForRates;
  } else {
    totals.era = 0;
    totals.whip = 0;
    totals.k9 = 0;
    totals.bb9 = 0;
  }

  totals.oba = totals.bf > 0 ? totals.h / totals.bf : 0;
  const weightedSlgNumerator = stats.reduce(
    (sum, line) => sum + (line.slg ?? 0) * (line.bf ?? 0),
    0,
  );
  totals.slg = totals.bf > 0 ? weightedSlgNumerator / totals.bf : 0;

  return totals;
};

const determineGameOutcome = (game: TeamCompletedGameType | null): GameOutcome => {
  if (!game) {
    return null;
  }

  const teamScore = game.isHomeTeam ? game.homeScore : game.visitorScore;
  const opponentScore = game.isHomeTeam ? game.visitorScore : game.homeScore;

  if (teamScore > opponentScore) {
    return 'win';
  }

  if (teamScore < opponentScore) {
    return 'loss';
  }

  return 'tie';
};

const getLockedRosterIds = (
  batting: GameBattingStatsType | null,
  pitching: GamePitchingStatsType | null,
): string[] => {
  const rosterIds = new Set<string>();

  batting?.stats.forEach((stat) => {
    if (stat.rosterSeasonId) {
      rosterIds.add(stat.rosterSeasonId);
    }
  });

  pitching?.stats.forEach((stat) => {
    if (stat.rosterSeasonId) {
      rosterIds.add(stat.rosterSeasonId);
    }
  });

  return Array.from(rosterIds);
};

const mergeAttendanceSelection = (current: string[], locked: string[]): string[] => {
  const next = [...current];
  locked.forEach((id) => {
    if (!next.includes(id)) {
      next.push(id);
    }
  });
  return next;
};

const buildPlayerSummaryFromStat = (
  stat: GameBattingStatLineType | GamePitchingStatLineType,
): TeamStatsPlayerSummaryType => ({
  rosterSeasonId: stat.rosterSeasonId,
  playerId: stat.playerId,
  contactId: stat.contactId,
  playerName: stat.playerName,
  playerNumber: stat.playerNumber ?? null,
  photoUrl: null,
});

const TeamStatEntryPage: React.FC<TeamStatEntryPageProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
}) => {
  const { token } = useAuth();
  const { hasRole, hasRoleInAccount, hasRoleInTeam } = useRole();
  const apiClient = useApiClient();
  const { settings: accountSettings } = useAccountSettings(accountId);

  const statsService = useMemo(
    () => new TeamStatsEntryService(token, apiClient),
    [apiClient, token],
  );

  const canManageStats = useMemo(
    () =>
      hasRole('Administrator') ||
      hasRoleInAccount('AccountAdmin', accountId) ||
      hasRoleInTeam('TeamAdmin', teamSeasonId),
    [accountId, hasRole, hasRoleInAccount, hasRoleInTeam, teamSeasonId],
  );

  const trackGamesPlayedEnabled = useMemo(() => {
    if (!accountSettings) {
      return true;
    }
    const state = accountSettings.find((setting) => setting.definition.key === 'TrackGamesPlayed');
    return Boolean(state?.effectiveValue ?? state?.value);
  }, [accountSettings]);

  const [teamHeaderData, setTeamHeaderData] = useState<{
    teamName: string;
    leagueName: string;
    seasonName: string;
    accountName: string;
    logoUrl?: string;
    record?: { wins: number; losses: number; ties: number };
    teamId?: string;
    leagueId?: string;
  } | null>(null);

  const [games, setGames] = useState<TeamCompletedGameType[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const [battingStats, setBattingStats] = useState<GameBattingStatsType | null>(null);
  const [pitchingStats, setPitchingStats] = useState<GamePitchingStatsType | null>(null);
  const [seasonBattingStats, setSeasonBattingStats] = useState<PlayerBattingStatsType[] | null>(
    null,
  );
  const [seasonPitchingStats, setSeasonPitchingStats] = useState<PlayerPitchingStatsType[] | null>(
    null,
  );
  const [, setAttendance] = useState<GameAttendanceType>(emptyAttendance);

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [seasonStatsLoading, setSeasonStatsLoading] = useState(true);
  const [seasonStatsError, setSeasonStatsError] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [tabValue, setTabValue] = useState<TabKey>('batting');
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);

  const [deleteBattingTarget, setDeleteBattingTarget] = useState<GameBattingStatLineType | null>(
    null,
  );

  const [deletePitchingTarget, setDeletePitchingTarget] = useState<GamePitchingStatLineType | null>(
    null,
  );

  const [attendanceSelection, setAttendanceSelection] = useState<string[]>([]);
  const [pendingAttendanceRosterId, setPendingAttendanceRosterId] = useState<string | null>(null);
  const cachedGameStatsRef = useRef<Map<string, CachedGameStats>>(new Map());
  const statsTabsCardRef = useRef<StatsTabsCardHandle | null>(null);

  useEffect(() => {
    cachedGameStatsRef.current.clear();
  }, [accountId, seasonId, teamSeasonId]);

  const applyCachedGameStats = useCallback(
    (cached: CachedGameStats) => {
      setBattingStats(cached.batting);
      setPitchingStats(cached.pitching);

      setAttendance(canManageStats ? (cached.attendance ?? emptyAttendance) : emptyAttendance);
      setAttendanceSelection(cached.attendanceSelection);
    },
    [canManageStats],
  );

  const updateCachedAttendance = useCallback(
    (gameId: string, attendanceValue: GameAttendanceType | null, selection: string[]) => {
      const existing = cachedGameStatsRef.current.get(gameId);
      if (!existing) {
        return;
      }

      cachedGameStatsRef.current.set(gameId, {
        ...existing,
        attendance: attendanceValue,
        attendanceSelection: selection,
      });
    },
    [],
  );

  const sortedGames = useMemo(() => {
    const next = [...games];
    next.sort((a, b) => {
      const dateA = new Date(a.gameDate).getTime();
      const dateB = new Date(b.gameDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return next;
  }, [games, sortOrder]);

  const selectedGame = useMemo(
    () => (selectedGameId ? (games.find((game) => game.gameId === selectedGameId) ?? null) : null),
    [games, selectedGameId],
  );

  const gameOutcome = useMemo(() => determineGameOutcome(selectedGame), [selectedGame]);

  useEffect(() => {
    let active = true;

    const loadGames = async () => {
      setGamesLoading(true);
      setGamesError(null);

      try {
        const data = await statsService.listCompletedGames(accountId, seasonId, teamSeasonId);
        if (!active) return;

        setGames(data);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load completed games.';
        setGamesError(message);
        setGames([]);
      } finally {
        if (active) {
          setGamesLoading(false);
        }
      }
    };

    void loadGames();

    return () => {
      active = false;
    };
  }, [accountId, seasonId, teamSeasonId, statsService]);

  const fetchSeasonStats = useCallback(async () => {
    const [batting, pitching] = await Promise.all([
      statsService.getSeasonBattingStats(accountId, seasonId, teamSeasonId),
      statsService.getSeasonPitchingStats(accountId, seasonId, teamSeasonId),
    ]);

    return { batting, pitching };
  }, [accountId, seasonId, teamSeasonId, statsService]);

  const refreshSeasonBattingStats = useCallback(async () => {
    try {
      const batting = await statsService.getSeasonBattingStats(accountId, seasonId, teamSeasonId);
      setSeasonBattingStats(batting);
      setSeasonStatsError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to refresh season batting statistics.';
      setSeasonStatsError(message);
    }
  }, [accountId, seasonId, teamSeasonId, statsService]);

  const refreshSeasonPitchingStats = useCallback(async () => {
    try {
      const pitching = await statsService.getSeasonPitchingStats(accountId, seasonId, teamSeasonId);
      setSeasonPitchingStats(pitching);
      setSeasonStatsError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to refresh season pitching statistics.';
      setSeasonStatsError(message);
    }
  }, [accountId, seasonId, teamSeasonId, statsService]);

  useEffect(() => {
    let active = true;
    setSeasonStatsLoading(true);
    setSeasonStatsError(null);

    const load = async () => {
      try {
        const { batting, pitching } = await fetchSeasonStats();
        if (!active) {
          return;
        }
        setSeasonBattingStats(batting);
        setSeasonPitchingStats(pitching);
      } catch (err) {
        if (!active) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Unable to load season statistics at this time.';
        setSeasonStatsError(message);
        setSeasonBattingStats([]);
        setSeasonPitchingStats([]);
      } finally {
        if (active) {
          setSeasonStatsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [fetchSeasonStats]);

  useEffect(() => {
    if (!sortedGames.length) {
      setSelectedGameId(null);
      return;
    }

    if (selectedGameId && !sortedGames.some((game) => game.gameId === selectedGameId)) {
      setSelectedGameId(null);
    }
  }, [sortedGames, selectedGameId]);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ message, severity });
  }, []);

  const loadAndActivateGame = useCallback(
    async (gameId: string, options?: { forceRefresh?: boolean }) => {
      if (!gameId) {
        return;
      }

      const { forceRefresh = false } = options ?? {};
      const shouldLoadAttendance = trackGamesPlayedEnabled && canManageStats;
      const cached = cachedGameStatsRef.current.get(gameId);

      if (!forceRefresh && cached && selectedGameId === gameId) {
        return;
      }

      if (!forceRefresh && cached) {
        setSelectedGameId(gameId);
        applyCachedGameStats(cached);
        setStatsError(null);
        setAttendanceError(null);
        if (!shouldLoadAttendance) {
          setAttendanceLoading(false);
        }
        return;
      }

      setStatsLoading(true);
      setStatsError(null);

      if (shouldLoadAttendance) {
        setAttendanceLoading(true);
        setAttendanceError(null);
      } else {
        setAttendanceLoading(false);
        setAttendanceError(null);
      }

      try {
        const [batting, pitching] = await Promise.all([
          statsService.getGameBattingStats(accountId, seasonId, teamSeasonId, gameId),
          statsService.getGamePitchingStats(accountId, seasonId, teamSeasonId, gameId),
        ]);

        const lockedRosterIdsForGame = new Set<string>();
        batting.stats.forEach((stat) => {
          if (stat.rosterSeasonId) {
            lockedRosterIdsForGame.add(stat.rosterSeasonId);
          }
        });
        pitching.stats.forEach((stat) => {
          if (stat.rosterSeasonId) {
            lockedRosterIdsForGame.add(stat.rosterSeasonId);
          }
        });

        let attendanceData: GameAttendanceType | null = null;
        let attendanceSelectionData = Array.from(lockedRosterIdsForGame);

        if (shouldLoadAttendance) {
          try {
            const attendanceResponse = await statsService.getGameAttendance(
              accountId,
              seasonId,
              teamSeasonId,
              gameId,
            );
            attendanceData = attendanceResponse;
            attendanceSelectionData = Array.from(
              new Set([...attendanceResponse.playerIds, ...lockedRosterIdsForGame]),
            );
            setAttendanceError(null);
          } catch (attendanceErr) {
            const message =
              attendanceErr instanceof Error ? attendanceErr.message : 'Unable to load attendance.';
            setAttendanceError(message);
            attendanceSelectionData = Array.from(lockedRosterIdsForGame);
          } finally {
            setAttendanceLoading(false);
          }
        } else {
          setAttendanceLoading(false);
        }

        const nextCache: CachedGameStats = {
          batting,
          pitching,
          attendance: attendanceData,
          attendanceSelection: attendanceSelectionData,
        };

        cachedGameStatsRef.current.set(gameId, nextCache);
        setSelectedGameId(gameId);
        applyCachedGameStats(nextCache);
        setStatsError(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load statistics for the selected game.';
        showSnackbar(message, 'error');
      } finally {
        setStatsLoading(false);
        if (!shouldLoadAttendance) {
          setAttendanceLoading(false);
        }
      }
    },
    [
      accountId,
      applyCachedGameStats,
      canManageStats,
      seasonId,
      selectedGameId,
      showSnackbar,
      statsService,
      teamSeasonId,
      trackGamesPlayedEnabled,
    ],
  );

  const playerSummaryMap = useMemo(() => {
    const map = new Map<string, TeamStatsPlayerSummaryType>();

    const addSummary = (summary: TeamStatsPlayerSummaryType) => {
      if (!summary?.rosterSeasonId) {
        return;
      }
      map.set(summary.rosterSeasonId, summary);
    };

    if (battingStats) {
      battingStats.availablePlayers?.forEach(addSummary);
      battingStats.stats.forEach((stat) => {
        addSummary({
          rosterSeasonId: stat.rosterSeasonId,
          playerId: stat.playerId,
          contactId: stat.contactId,
          playerName: stat.playerName,
          playerNumber: stat.playerNumber ?? null,
          photoUrl: null,
        });
      });
    }

    if (pitchingStats) {
      pitchingStats.availablePlayers?.forEach(addSummary);
      pitchingStats.stats.forEach((stat) => {
        addSummary({
          rosterSeasonId: stat.rosterSeasonId,
          playerId: stat.playerId,
          contactId: stat.contactId,
          playerName: stat.playerName,
          playerNumber: stat.playerNumber ?? null,
          photoUrl: null,
        });
      });
    }

    return map;
  }, [battingStats, pitchingStats]);

  const attendanceOptions = useMemo(() => {
    const summaries = Array.from(playerSummaryMap.values());
    summaries.sort((a, b) => a.playerName.localeCompare(b.playerName));
    return summaries;
  }, [playerSummaryMap]);

  const availableBattingPlayers = battingStats?.availablePlayers ?? [];
  const availablePitchingPlayers = pitchingStats?.availablePlayers ?? [];

  const handleSortOrderChange = (order: SortOrder) => {
    setSortOrder(order);
  };

  const attemptGameSelect = useCallback(
    async (gameId: string) => {
      if (!gameId || selectedGameId === gameId || statsLoading) {
        return;
      }

      const cardHandle = statsTabsCardRef.current;
      if (cardHandle?.hasPendingEdits()) {
        const resolved = await cardHandle.resolvePendingEdits('game-change');
        if (!resolved) {
          return;
        }
      }

      await loadAndActivateGame(gameId);
    },
    [loadAndActivateGame, selectedGameId, statsLoading],
  );

  const handleGameSelect = (gameId: string) => {
    void attemptGameSelect(gameId);
  };

  const handleTabChange = (nextTab: TabKey) => {
    if (
      nextTab === 'attendance' &&
      (!canManageStats || !selectedGameId || !trackGamesPlayedEnabled)
    ) {
      setTabValue('batting');
      return;
    }
    setTabValue(nextTab);
  };

  const handleGridError = useCallback(
    (error: Error) => {
      showSnackbar(error.message, 'error');
    },
    [showSnackbar],
  );

  const handleCreateBattingStat = useCallback(
    async (payload: CreateGameBattingStatType) => {
      if (!selectedGameId || !battingStats) {
        throw new Error('Batting stats are not available for editing.');
      }

      try {
        const created = await statsService.createGameBattingStat(
          accountId,
          seasonId,
          teamSeasonId,
          selectedGameId,
          payload,
        );

        let nextLockedIds: string[] = [];
        setBattingStats((previous) => {
          if (!previous) {
            return previous;
          }

          const nextStats = [...previous.stats, created];
          const nextTotals = calculateBattingTotals(nextStats);
          const nextAvailable = previous.availablePlayers.filter(
            (player) => player.rosterSeasonId !== created.rosterSeasonId,
          );

          const nextBatting: GameBattingStatsType = {
            ...previous,
            stats: nextStats,
            totals: nextTotals,
            availablePlayers: nextAvailable,
          };

          const cachedEntry = cachedGameStatsRef.current.get(selectedGameId) ?? {
            batting: nextBatting,
            pitching: pitchingStats ?? {
              gameId: selectedGameId,
              teamSeasonId,
              stats: [],
              totals: calculatePitchingTotals([]),
              availablePlayers: [],
            },
            attendance: emptyAttendance,
            attendanceSelection,
          };

          cachedGameStatsRef.current.set(selectedGameId, {
            ...cachedEntry,
            batting: nextBatting,
          });

          nextLockedIds = getLockedRosterIds(nextBatting, cachedEntry.pitching ?? pitchingStats);

          return nextBatting;
        });

        if (nextLockedIds.length) {
          const nextSelection = mergeAttendanceSelection(attendanceSelection, nextLockedIds);
          setAttendanceSelection(nextSelection);

          const cachedEntry = cachedGameStatsRef.current.get(selectedGameId);
          if (cachedEntry) {
            cachedGameStatsRef.current.set(selectedGameId, {
              ...cachedEntry,
              attendanceSelection: nextSelection,
            });
          }
        }

        showSnackbar('Batting stat added.');
        void refreshSeasonBattingStats();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unable to add batting stat.');
        showSnackbar(err.message, 'error');
        throw err;
      }
    },
    [
      accountId,
      attendanceSelection,
      battingStats,
      pitchingStats,
      seasonId,
      selectedGameId,
      showSnackbar,
      refreshSeasonBattingStats,
      statsService,
      teamSeasonId,
    ],
  );

  const handleUpdateBattingStat = useCallback(
    async (statId: string, payload: UpdateGameBattingStatType) => {
      if (!selectedGameId || !battingStats) {
        throw new Error('Batting stats are not available for editing.');
      }

      try {
        const updated = await statsService.updateGameBattingStat(
          accountId,
          seasonId,
          teamSeasonId,
          selectedGameId,
          statId,
          payload,
        );

        let nextLockedIds: string[] = [];
        setBattingStats((previous) => {
          if (!previous) {
            return previous;
          }

          const nextStats = previous.stats.map((line) =>
            line.statId === updated.statId ? updated : line,
          );
          const nextTotals = calculateBattingTotals(nextStats);

          const nextBatting: GameBattingStatsType = {
            ...previous,
            stats: nextStats,
            totals: nextTotals,
          };

          const cachedEntry = cachedGameStatsRef.current.get(selectedGameId) ?? {
            batting: nextBatting,
            pitching: pitchingStats ?? {
              gameId: selectedGameId,
              teamSeasonId,
              stats: [],
              totals: calculatePitchingTotals([]),
              availablePlayers: [],
            },
            attendance: emptyAttendance,
            attendanceSelection,
          };

          cachedGameStatsRef.current.set(selectedGameId, {
            ...cachedEntry,
            batting: nextBatting,
          });

          nextLockedIds = getLockedRosterIds(nextBatting, cachedEntry.pitching ?? pitchingStats);

          return nextBatting;
        });

        if (nextLockedIds.length) {
          const nextSelection = mergeAttendanceSelection(attendanceSelection, nextLockedIds);
          setAttendanceSelection(nextSelection);

          const cachedEntry = cachedGameStatsRef.current.get(selectedGameId);
          if (cachedEntry) {
            cachedGameStatsRef.current.set(selectedGameId, {
              ...cachedEntry,
              attendanceSelection: nextSelection,
            });
          }
        }

        showSnackbar('Batting stat updated.');
        void refreshSeasonBattingStats();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unable to update batting stat.');
        showSnackbar(err.message, 'error');
        throw err;
      }
    },
    [
      accountId,
      attendanceSelection,
      battingStats,
      pitchingStats,
      seasonId,
      selectedGameId,
      showSnackbar,
      refreshSeasonBattingStats,
      statsService,
      teamSeasonId,
    ],
  );

  const handleDeleteBatting = async (stat: GameBattingStatLineType | null) => {
    if (!selectedGameId || !stat) return;
    try {
      await statsService.deleteGameBattingStat(
        accountId,
        seasonId,
        teamSeasonId,
        selectedGameId,
        stat.statId,
      );
      showSnackbar('Batting stat removed.');
      let nextLockedIds: string[] = [];
      setBattingStats((previous) => {
        if (!previous) {
          return previous;
        }

        const nextStats = previous.stats.filter((line) => line.statId !== stat.statId);
        const nextTotals = calculateBattingTotals(nextStats);
        const nextAvailable = [...previous.availablePlayers];
        const candidate = buildPlayerSummaryFromStat(stat);
        if (!nextAvailable.some((player) => player.rosterSeasonId === candidate.rosterSeasonId)) {
          nextAvailable.push(candidate);
        }

        const nextBatting: GameBattingStatsType = {
          ...previous,
          stats: nextStats,
          totals: nextTotals,
          availablePlayers: nextAvailable,
        };

        const cachedEntry = cachedGameStatsRef.current.get(selectedGameId) ?? {
          batting: nextBatting,
          pitching: pitchingStats ?? {
            gameId: selectedGameId,
            teamSeasonId,
            stats: [],
            totals: calculatePitchingTotals([]),
            availablePlayers: [],
          },
          attendance: emptyAttendance,
          attendanceSelection,
        };

        cachedGameStatsRef.current.set(selectedGameId, {
          ...cachedEntry,
          batting: nextBatting,
        });

        nextLockedIds = getLockedRosterIds(nextBatting, cachedEntry.pitching ?? pitchingStats);

        return nextBatting;
      });

      const nextSelection = mergeAttendanceSelection(attendanceSelection, nextLockedIds);
      setAttendanceSelection(nextSelection);
      const cachedEntry = cachedGameStatsRef.current.get(selectedGameId);
      if (cachedEntry) {
        cachedGameStatsRef.current.set(selectedGameId, {
          ...cachedEntry,
          attendanceSelection: nextSelection,
        });
      }

      void refreshSeasonBattingStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete batting stat.';
      showSnackbar(message, 'error');
    }
  };

  const handleCreatePitchingStat = useCallback(
    async (payload: CreateGamePitchingStatType) => {
      if (!selectedGameId || !pitchingStats) {
        throw new Error('Pitching stats are not available for editing.');
      }

      try {
        const created = await statsService.createGamePitchingStat(
          accountId,
          seasonId,
          teamSeasonId,
          selectedGameId,
          payload,
        );

        let nextLockedIds: string[] = [];
        setPitchingStats((previous) => {
          if (!previous) {
            return previous;
          }

          const nextStats = [...previous.stats, created];
          const nextTotals = calculatePitchingTotals(nextStats);
          const nextAvailable = previous.availablePlayers.filter(
            (player) => player.rosterSeasonId !== created.rosterSeasonId,
          );

          const nextPitching: GamePitchingStatsType = {
            ...previous,
            stats: nextStats,
            totals: nextTotals,
            availablePlayers: nextAvailable,
          };

          const cachedEntry = cachedGameStatsRef.current.get(selectedGameId) ?? {
            batting: battingStats ?? {
              gameId: selectedGameId,
              teamSeasonId,
              stats: [],
              totals: calculateBattingTotals([]),
              availablePlayers: [],
            },
            pitching: nextPitching,
            attendance: emptyAttendance,
            attendanceSelection,
          };

          cachedGameStatsRef.current.set(selectedGameId, {
            ...cachedEntry,
            pitching: nextPitching,
          });

          nextLockedIds = getLockedRosterIds(cachedEntry.batting ?? battingStats, nextPitching);

          return nextPitching;
        });

        const nextSelection = mergeAttendanceSelection(attendanceSelection, nextLockedIds);
        setAttendanceSelection(nextSelection);
        const cachedEntry = cachedGameStatsRef.current.get(selectedGameId);
        if (cachedEntry) {
          cachedGameStatsRef.current.set(selectedGameId, {
            ...cachedEntry,
            attendanceSelection: nextSelection,
          });
        }

        showSnackbar('Pitching stat added.');
        void refreshSeasonPitchingStats();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unable to add pitching stat.');
        showSnackbar(err.message, 'error');
        throw err;
      }
    },
    [
      accountId,
      attendanceSelection,
      battingStats,
      pitchingStats,
      seasonId,
      selectedGameId,
      showSnackbar,
      refreshSeasonPitchingStats,
      statsService,
      teamSeasonId,
    ],
  );

  const handleUpdatePitchingStat = useCallback(
    async (statId: string, payload: UpdateGamePitchingStatType) => {
      if (!selectedGameId || !pitchingStats) {
        throw new Error('Pitching stats are not available for editing.');
      }

      try {
        const updated = await statsService.updateGamePitchingStat(
          accountId,
          seasonId,
          teamSeasonId,
          selectedGameId,
          statId,
          payload,
        );

        let nextLockedIds: string[] = [];
        setPitchingStats((previous) => {
          if (!previous) {
            return previous;
          }

          const nextStats = previous.stats.map((line) =>
            line.statId === updated.statId ? updated : line,
          );
          const nextTotals = calculatePitchingTotals(nextStats);

          const nextPitching: GamePitchingStatsType = {
            ...previous,
            stats: nextStats,
            totals: nextTotals,
          };

          const cachedEntry = cachedGameStatsRef.current.get(selectedGameId) ?? {
            batting: battingStats ?? {
              gameId: selectedGameId,
              teamSeasonId,
              stats: [],
              totals: calculateBattingTotals([]),
              availablePlayers: [],
            },
            pitching: nextPitching,
            attendance: emptyAttendance,
            attendanceSelection,
          };

          cachedGameStatsRef.current.set(selectedGameId, {
            ...cachedEntry,
            pitching: nextPitching,
          });

          nextLockedIds = getLockedRosterIds(cachedEntry.batting ?? battingStats, nextPitching);

          return nextPitching;
        });

        const nextSelection = mergeAttendanceSelection(attendanceSelection, nextLockedIds);
        setAttendanceSelection(nextSelection);
        const cachedEntry = cachedGameStatsRef.current.get(selectedGameId);
        if (cachedEntry) {
          cachedGameStatsRef.current.set(selectedGameId, {
            ...cachedEntry,
            attendanceSelection: nextSelection,
          });
        }

        showSnackbar('Pitching stat updated.');
        void refreshSeasonPitchingStats();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unable to update pitching stat.');
        showSnackbar(err.message, 'error');
        throw err;
      }
    },
    [
      accountId,
      attendanceSelection,
      battingStats,
      pitchingStats,
      seasonId,
      selectedGameId,
      showSnackbar,
      refreshSeasonPitchingStats,
      statsService,
      teamSeasonId,
    ],
  );

  const handleDeletePitching = async (stat: GamePitchingStatLineType | null) => {
    if (!selectedGameId || !stat) return;
    try {
      await statsService.deleteGamePitchingStat(
        accountId,
        seasonId,
        teamSeasonId,
        selectedGameId,
        stat.statId,
      );
      showSnackbar('Pitching stat removed.');

      let nextLockedIds: string[] = [];
      setPitchingStats((previous) => {
        if (!previous) {
          return previous;
        }

        const nextStats = previous.stats.filter((line) => line.statId !== stat.statId);
        const nextTotals = calculatePitchingTotals(nextStats);
        const nextAvailable = [...previous.availablePlayers];
        const candidate = buildPlayerSummaryFromStat(stat);
        if (!nextAvailable.some((player) => player.rosterSeasonId === candidate.rosterSeasonId)) {
          nextAvailable.push(candidate);
        }

        const nextPitching: GamePitchingStatsType = {
          ...previous,
          stats: nextStats,
          totals: nextTotals,
          availablePlayers: nextAvailable,
        };

        const cachedEntry = cachedGameStatsRef.current.get(selectedGameId) ?? {
          batting: battingStats ?? {
            gameId: selectedGameId,
            teamSeasonId,
            stats: [],
            totals: calculateBattingTotals([]),
            availablePlayers: [],
          },
          pitching: nextPitching,
          attendance: emptyAttendance,
          attendanceSelection,
        };

        cachedGameStatsRef.current.set(selectedGameId, {
          ...cachedEntry,
          pitching: nextPitching,
        });

        nextLockedIds = getLockedRosterIds(cachedEntry.batting ?? battingStats, nextPitching);

        return nextPitching;
      });

      const nextSelection = mergeAttendanceSelection(attendanceSelection, nextLockedIds);
      setAttendanceSelection(nextSelection);
      const cachedEntry = cachedGameStatsRef.current.get(selectedGameId);
      if (cachedEntry) {
        cachedGameStatsRef.current.set(selectedGameId, {
          ...cachedEntry,
          attendanceSelection: nextSelection,
        });
      }

      void refreshSeasonPitchingStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete pitching stat.';
      showSnackbar(message, 'error');
    }
  };

  const lockedAttendanceRosterIds = useMemo(() => {
    const ids = new Set<string>();
    battingStats?.stats.forEach((stat) => {
      if (stat.rosterSeasonId) {
        ids.add(stat.rosterSeasonId);
      }
    });
    pitchingStats?.stats.forEach((stat) => {
      if (stat.rosterSeasonId) {
        ids.add(stat.rosterSeasonId);
      }
    });
    return Array.from(ids);
  }, [battingStats, pitchingStats]);
  const handleAttendanceToggle = useCallback(
    async (rosterSeasonId: string, present: boolean) => {
      if (
        !selectedGameId ||
        !canManageStats ||
        pendingAttendanceRosterId ||
        !trackGamesPlayedEnabled
      ) {
        return;
      }

      try {
        setPendingAttendanceRosterId(rosterSeasonId);
        setAttendanceError(null);

        const updated = await statsService.updateGameAttendance(
          accountId,
          seasonId,
          teamSeasonId,
          selectedGameId,
          {
            rosterSeasonId,
            present,
          },
        );

        setAttendance(updated);
        const combined = Array.from(new Set([...updated.playerIds, ...lockedAttendanceRosterIds]));
        setAttendanceSelection(combined);
        updateCachedAttendance(selectedGameId, updated, combined);
        showSnackbar('Attendance updated successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update attendance.';
        setAttendanceError(message);
        showSnackbar(message, 'error');
      } finally {
        setPendingAttendanceRosterId(null);
      }
    },
    [
      accountId,
      canManageStats,
      pendingAttendanceRosterId,
      lockedAttendanceRosterIds,
      seasonId,
      selectedGameId,
      showSnackbar,
      statsService,
      teamSeasonId,
      updateCachedAttendance,
      trackGamesPlayedEnabled,
    ],
  );

  const battingTotals = battingStats?.totals ?? null;
  const pitchingTotals = pitchingStats?.totals ?? null;

  useEffect(() => {
    if (!trackGamesPlayedEnabled) {
      setAttendance(emptyAttendance);
      setAttendanceSelection([]);
      setAttendanceError(null);
      setAttendanceLoading(false);
    }
  }, [trackGamesPlayedEnabled]);

  useEffect(() => {
    if (!lockedAttendanceRosterIds.length) {
      return;
    }

    setAttendanceSelection((current) => {
      const set = new Set(current);
      let changed = false;
      lockedAttendanceRosterIds.forEach((id) => {
        if (!set.has(id)) {
          set.add(id);
          changed = true;
        }
      });

      return changed ? Array.from(set) : current;
    });
  }, [lockedAttendanceRosterIds]);

  useEffect(() => {
    if ((!canManageStats || !selectedGameId) && tabValue === 'attendance') {
      setTabValue('batting');
    }
  }, [canManageStats, selectedGameId, tabValue]);

  const handleTeamDataLoaded = useCallback(
    (data: {
      teamName: string;
      leagueName: string;
      seasonName: string;
      accountName: string;
      logoUrl?: string;
      record?: { wins: number; losses: number; ties: number };
      teamId?: string;
      leagueId?: string;
    }) => {
      setTeamHeaderData((previous) => {
        const recordsMatch = (() => {
          if (!previous?.record && !data.record) {
            return true;
          }
          if (!previous?.record || !data.record) {
            return false;
          }
          return (
            previous.record.wins === data.record.wins &&
            previous.record.losses === data.record.losses &&
            previous.record.ties === data.record.ties
          );
        })();

        if (
          previous &&
          previous.teamName === data.teamName &&
          previous.leagueName === data.leagueName &&
          previous.seasonName === data.seasonName &&
          previous.accountName === data.accountName &&
          previous.logoUrl === data.logoUrl &&
          recordsMatch &&
          previous.teamId === data.teamId &&
          previous.leagueId === data.leagueId
        ) {
          return previous;
        }

        return {
          teamName: data.teamName,
          leagueName: data.leagueName,
          seasonName: data.seasonName,
          accountName: data.accountName,
          logoUrl: data.logoUrl,
          record: data.record,
          teamId: data.teamId,
          leagueId: data.leagueId,
        };
      });
    },
    [],
  );

  return (
    <main className="min-h-screen bg-background">
      <Box>
        <AccountPageHeader accountId={accountId} style={{ marginBottom: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ position: 'relative' }}
          >
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}
                >
                  <TeamAvatar
                    name={teamHeaderData?.teamName || ''}
                    logoUrl={teamHeaderData?.logoUrl || undefined}
                    size={60}
                    alt={teamHeaderData?.teamName ? `${teamHeaderData.teamName} logo` : 'Team logo'}
                  />
                  {teamHeaderData?.leagueName && (
                    <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                      {teamHeaderData.leagueName}
                    </Typography>
                  )}
                  {teamHeaderData?.teamName && (
                    <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                      {teamHeaderData.teamName}
                    </Typography>
                  )}
                </Box>
                {teamHeaderData?.record && (
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ fontWeight: 'medium', opacity: 0.9 }}
                  >
                    {teamHeaderData.record.wins}-{teamHeaderData.record.losses}
                    {teamHeaderData.record.ties > 0 ? `-${teamHeaderData.record.ties}` : ''}
                  </Typography>
                )}
                {teamHeaderData?.seasonName && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontWeight: 'normal', opacity: 0.8 }}
                  >
                    {teamHeaderData.seasonName} Season
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </AccountPageHeader>

        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink
              component={NextLink}
              href={`/account/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}`}
              underline="hover"
              color="inherit"
              sx={{ fontWeight: 500, ml: 3 }}
            >
              {teamHeaderData?.teamName ?? 'Team'}
            </MuiLink>
            <Typography color="text.primary" sx={{ fontWeight: 500 }}>
              Statistics
            </Typography>
          </Breadcrumbs>
        </Box>

        <div style={{ display: 'none' }}>
          <TeamInfoCard
            accountId={accountId}
            seasonId={seasonId}
            teamSeasonId={teamSeasonId}
            onTeamDataLoaded={handleTeamDataLoaded}
          />
        </div>

        <GameListCard
          games={sortedGames}
          selectedGameId={selectedGameId}
          onSelectGame={handleGameSelect}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
          loading={gamesLoading}
          error={gamesError}
          canManageStats={canManageStats}
        />

        <StatsTabsCard
          ref={statsTabsCardRef}
          tab={tabValue}
          onTabChange={handleTabChange}
          canManageStats={canManageStats}
          enableAttendanceTracking={trackGamesPlayedEnabled}
          loading={statsLoading}
          error={statsError}
          selectedGameId={selectedGameId}
          battingStats={battingStats}
          pitchingStats={pitchingStats}
          battingTotals={battingTotals}
          pitchingTotals={pitchingTotals}
          availableBatters={availableBattingPlayers}
          availablePitchers={availablePitchingPlayers}
          onCreateBattingStat={handleCreateBattingStat}
          onUpdateBattingStat={handleUpdateBattingStat}
          onDeleteBattingStat={setDeleteBattingTarget}
          onCreatePitchingStat={handleCreatePitchingStat}
          onUpdatePitchingStat={handleUpdatePitchingStat}
          onDeletePitchingStat={setDeletePitchingTarget}
          onProcessError={handleGridError}
          attendanceOptions={attendanceOptions}
          attendanceSelection={attendanceSelection}
          onAttendanceToggle={handleAttendanceToggle}
          lockedAttendanceRosterIds={lockedAttendanceRosterIds}
          attendanceLoading={attendanceLoading}
          attendanceError={attendanceError}
          pendingAttendanceRosterId={pendingAttendanceRosterId}
          seasonBattingStats={seasonBattingStats}
          seasonPitchingStats={seasonPitchingStats}
          seasonLoading={seasonStatsLoading}
          seasonError={seasonStatsError}
          gameOutcome={gameOutcome}
          onClearGameSelection={() => {
            setSelectedGameId(null);
          }}
        />

        <AsyncConfirmDialog
          open={Boolean(deleteBattingTarget)}
          title="Remove batting stat"
          description="This will remove the player's batting line from this game."
          confirmLabel="Delete"
          confirmColor="error"
          onClose={() => setDeleteBattingTarget(null)}
          onConfirm={async () => {
            if (!deleteBattingTarget) return;
            await handleDeleteBatting(deleteBattingTarget);
          }}
        />

        <AsyncConfirmDialog
          open={Boolean(deletePitchingTarget)}
          title="Remove pitching stat"
          description="This will remove the player's pitching line from this game."
          confirmLabel="Delete"
          confirmColor="error"
          onClose={() => setDeletePitchingTarget(null)}
          onConfirm={async () => {
            if (!deletePitchingTarget) return;
            await handleDeletePitching(deletePitchingTarget);
          }}
        />

        {snackbar && (
          <Snackbar
            open
            autoHideDuration={4000}
            onClose={() => setSnackbar(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar(null)}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </main>
  );
};

export default TeamStatEntryPage;
