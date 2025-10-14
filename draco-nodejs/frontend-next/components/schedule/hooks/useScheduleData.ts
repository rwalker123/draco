import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCurrentSeason } from '../../../hooks/useCurrentSeason';
import { useApiClient } from '../../../hooks/useApiClient';
import { Game, Field, Umpire, League, FilterType } from '@/types/schedule';
import {
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import {
  listAccountFields,
  listAccountUmpires,
  listSeasonGames,
  listSeasonLeagueSeasons,
} from '@draco/shared-api-client';
import { ApiClientError, unwrapApiResult } from '../../../utils/apiResult';
import { mapLeagueSetup } from '../../../utils/leagueSeasonMapper';
import { mapGameResponseToScheduleGame } from '../../../utils/gameTransformers';
import { TeamSeasonType } from '@draco/shared-schemas';

interface UseScheduleDataProps {
  accountId: string;
  filterType: FilterType;
  filterDate: Date;
}

interface UseScheduleDataReturn {
  games: Game[];
  teams: TeamSeasonType[];
  fields: Field[];
  umpires: Umpire[];
  leagues: League[];
  leagueTeams: TeamSeasonType[];
  leagueTeamsCache: Map<string, TeamSeasonType[]>;
  loadingGames: boolean;
  loadingStaticData: boolean;
  error: string | null;
  success: string | null;
  loadStaticData: () => Promise<void>;
  loadGamesData: () => Promise<void>;
  loadLeagueTeams: (leagueSeasonId: string) => void;
  loadUmpires: () => Promise<void>;
  clearLeagueTeams: () => void;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
  upsertGameInCache: (game: Game) => void;
  removeGameFromCache: (gameId: string) => void;
  filteredGames: Game[];
  startDate: Date;
  endDate: Date;
}

const API_PAGE_LIMIT = 100;

const sortGamesAscending = (a: Game, b: Game): number => {
  const diff = new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
  if (diff !== 0) {
    return diff;
  }
  return a.id.localeCompare(b.id);
};

export const useScheduleData = ({
  accountId,
  filterType,
  filterDate,
}: UseScheduleDataProps): UseScheduleDataReturn => {
  const { loading: authLoading } = useAuth();
  const { fetchCurrentSeason } = useCurrentSeason(accountId);
  const apiClient = useApiClient();

  const [teams, setTeams] = useState<TeamSeasonType[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [umpires, setUmpires] = useState<Umpire[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<TeamSeasonType[]>([]);
  const [leagueTeamsCache, setLeagueTeamsCache] = useState<Map<string, TeamSeasonType[]>>(
    new Map(),
  );

  const [games, setGames] = useState<Game[]>([]);
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const gamesCacheRef = useRef<Map<string, Game[]>>(new Map());
  const gamesRequestCacheRef = useRef<Map<string, Promise<Game[]>>>(new Map());
  const lastRangeRef = useRef<{ start: number; end: number } | null>(null);

  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingStaticData, setLoadingStaticData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => {
    let start: Date;
    let end: Date;

    switch (filterType) {
      case 'day':
        start = new Date(filterDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(filterDate);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = startOfWeek(filterDate);
        end = endOfWeek(filterDate);
        break;
      case 'month':
        start = startOfMonth(filterDate);
        end = endOfMonth(filterDate);
        break;
      case 'year':
        start = startOfYear(filterDate);
        end = endOfYear(filterDate);
        break;
      default:
        start = startOfMonth(filterDate);
        end = endOfMonth(filterDate);
    }

    return { startDate: start, endDate: end };
  }, [filterType, filterDate]);

  const getMonthKeyFromDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const getMonthRangeForKey = useCallback((monthKey: string): { start: Date; end: Date } => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const start = new Date(year, monthIndex, 1);
    const end = endOfMonth(start);
    return { start, end };
  }, []);

  const getMonthKeysForRange = useCallback(
    (rangeStart: Date, rangeEnd: Date): string[] => {
      const months = eachMonthOfInterval({
        start: startOfMonth(rangeStart),
        end: startOfMonth(rangeEnd),
      });
      return months.map((monthDate) => getMonthKeyFromDate(monthDate));
    },
    [getMonthKeyFromDate],
  );

  const collectGamesForRange = useCallback(
    (rangeStart: Date, rangeEnd: Date): Game[] => {
      const monthKeys = getMonthKeysForRange(rangeStart, rangeEnd);
      const startTime = rangeStart.getTime();
      const endTime = rangeEnd.getTime();

      const aggregated = new Map<string, Game>();
      monthKeys.forEach((monthKey) => {
        const monthGames = gamesCacheRef.current.get(monthKey);
        if (!monthGames) {
          return;
        }

        monthGames.forEach((game) => {
          const gameTime = new Date(game.gameDate).getTime();
          if (gameTime >= startTime && gameTime <= endTime) {
            aggregated.set(game.id, game);
          }
        });
      });

      return Array.from(aggregated.values()).sort(sortGamesAscending);
    },
    [getMonthKeysForRange],
  );

  const refreshGamesForLastRange = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    const range = lastRangeRef.current;
    if (!range) {
      return;
    }

    const start = new Date(range.start);
    const end = new Date(range.end);
    const nextGames = collectGamesForRange(start, end);
    setGames(nextGames);
  }, [collectGamesForRange]);

  useEffect(() => {
    gamesCacheRef.current.clear();
    gamesRequestCacheRef.current.clear();
    lastRangeRef.current = null;
    setGames([]);
  }, [accountId]);

  const loadStaticData = useCallback(async () => {
    try {
      setLoadingStaticData(true);
      setError(null);

      const currentSeasonId = await fetchCurrentSeason();

      try {
        const leagueResult = await listSeasonLeagueSeasons({
          client: apiClient,
          path: { accountId, seasonId: currentSeasonId },
          query: {
            includeTeams: true,
            includeUnassignedTeams: true,
          },
          throwOnError: false,
        });

        const leagueData = unwrapApiResult(leagueResult, 'Failed to load leagues');
        const mapped = mapLeagueSetup(leagueData);

        const newLeagueTeamsCache = new Map<string, TeamSeasonType[]>();
        const processedLeagues = mapped.leagueSeasons.map((leagueSeason) => {
          const leagueTeamsForSeason: TeamSeasonType[] = [];

          leagueSeason.divisions?.forEach((division) => {
            division.teams.forEach((team) => {
              leagueTeamsForSeason.push(team);
            });
          });

          leagueSeason.unassignedTeams?.forEach((team) => {
            leagueTeamsForSeason.push(team);
          });

          newLeagueTeamsCache.set(leagueSeason.id, leagueTeamsForSeason);

          return {
            id: leagueSeason.id,
            name: leagueSeason.league.name,
          };
        });

        setLeagues(processedLeagues);
        setLeagueTeamsCache(newLeagueTeamsCache);

        const uniqueTeams = new Map<string, TeamSeasonType>();
        newLeagueTeamsCache.forEach((teamsForSeason) => {
          teamsForSeason.forEach((team) => {
            if (!uniqueTeams.has(team.id)) {
              uniqueTeams.set(team.id, team);
            }
          });
        });
        setTeams(Array.from(uniqueTeams.values()));
      } catch (leagueError) {
        console.warn('Failed to load leagues:', leagueError);
        setLeagues([]);
        setLeagueTeamsCache(new Map());
        setTeams([]);
      }

      try {
        const fieldsResult = await listAccountFields({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        const fieldsData = unwrapApiResult(fieldsResult, 'Failed to load fields');
        const mappedFields: Field[] = fieldsData.fields.map((field) => ({
          id: field.id,
          name: field.name,
          shortName: field.shortName,
          comment: field.comment ?? '',
          address: field.address ?? '',
          city: field.city ?? '',
          state: field.state ?? '',
          zipCode: field.zip ?? '',
          directions: field.directions ?? '',
          rainoutNumber: field.rainoutNumber ?? '',
          latitude: field.latitude ? String(field.latitude) : '',
          longitude: field.longitude ? String(field.longitude) : '',
        }));
        setFields(mappedFields);
      } catch (fieldsError) {
        console.warn('Failed to load fields:', fieldsError);
        setFields([]);
      }

      setUmpires([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load static data');
    } finally {
      setLoadingStaticData(false);
    }
  }, [accountId, apiClient, fetchCurrentSeason]);

  const loadGamesData = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setLoadingGames(true);
        setError(null);
      }

      const seasonId = await fetchCurrentSeason();
      const monthKeys = getMonthKeysForRange(startDate, endDate);

      if (monthKeys.length === 0) {
        if (isMountedRef.current) {
          setGames([]);
          lastRangeRef.current = { start: startDate.getTime(), end: endDate.getTime() };
        }
        return;
      }

      const fetchPromises = monthKeys.map((monthKey) => {
        if (gamesCacheRef.current.has(monthKey)) {
          return Promise.resolve(gamesCacheRef.current.get(monthKey)!);
        }

        let requestPromise = gamesRequestCacheRef.current.get(monthKey);
        if (!requestPromise) {
          const { start, end } = getMonthRangeForKey(monthKey);

          requestPromise = (async () => {
            const aggregated = new Map<string, Game>();
            let page = 1;

            while (true) {
              const gamesResult = await listSeasonGames({
                client: apiClient,
                path: { accountId, seasonId },
                query: {
                  startDate: start.toISOString(),
                  endDate: end.toISOString(),
                  sortOrder: 'asc',
                  page,
                  limit: API_PAGE_LIMIT,
                },
                throwOnError: false,
              });

              const gamesData = unwrapApiResult(gamesResult, 'Failed to load games');
              const mappedGames = gamesData.games.map(mapGameResponseToScheduleGame);

              mappedGames.forEach((game) => {
                aggregated.set(game.id, game);
              });

              const { total, limit } = gamesData.pagination;
              if (limit === 0 || page * limit >= total) {
                break;
              }
              page += 1;
            }

            const sortedGames = Array.from(aggregated.values()).sort(sortGamesAscending);
            gamesCacheRef.current.set(monthKey, sortedGames);
            return sortedGames;
          })();

          gamesRequestCacheRef.current.set(monthKey, requestPromise);
          requestPromise.finally(() => {
            gamesRequestCacheRef.current.delete(monthKey);
          });
        }

        return requestPromise;
      });

      await Promise.all(fetchPromises);

      if (isMountedRef.current) {
        const nextGames = collectGamesForRange(startDate, endDate);
        setGames(nextGames);
        setError(null);
        lastRangeRef.current = { start: startDate.getTime(), end: endDate.getTime() };
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingGames(false);
      }
    }
  }, [
    accountId,
    apiClient,
    collectGamesForRange,
    endDate,
    fetchCurrentSeason,
    getMonthKeysForRange,
    getMonthRangeForKey,
    startDate,
  ]);

  const loadLeagueTeams = useCallback(
    (leagueSeasonId: string) => {
      if (!leagueSeasonId) {
        setLeagueTeams([]);
        return;
      }

      const cachedTeams = leagueTeamsCache.get(leagueSeasonId);
      if (cachedTeams) {
        setLeagueTeams(cachedTeams);
      } else {
        setLeagueTeams([]);
      }
    },
    [leagueTeamsCache],
  );

  const loadUmpires = useCallback(async () => {
    try {
      const result = await listAccountUmpires({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to load umpires');
      const mapped: Umpire[] = data.umpires.map((umpire) => ({
        id: umpire.id,
        contactId: umpire.contactId,
        firstName: umpire.firstName,
        lastName: umpire.lastName,
        email: umpire.email ?? '',
        displayName: umpire.displayName,
      }));
      setUmpires(mapped);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setUmpires([]);
        return;
      }

      console.warn('Failed to load umpires:', err);
      setUmpires([]);
    }
  }, [accountId, apiClient]);

  const clearLeagueTeams = useCallback(() => {
    setLeagueTeams([]);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      loadStaticData();
    }
  }, [authLoading, loadStaticData]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadGamesData().catch((err) => {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      }
    });
  }, [authLoading, loadGamesData]);

  const pruneGameFromCache = useCallback((gameId: string): boolean => {
    if (!gameId) {
      return false;
    }

    let removed = false;
    gamesCacheRef.current.forEach((monthGames, monthKey) => {
      const filtered = monthGames.filter((game) => game.id !== gameId);
      if (filtered.length !== monthGames.length) {
        gamesCacheRef.current.set(monthKey, filtered);
        removed = true;
      }
    });

    return removed;
  }, []);

  const upsertGameInCache = useCallback(
    (game: Game) => {
      if (!game) {
        return;
      }

      pruneGameFromCache(game.id);

      const gameMonthKey = getMonthKeyFromDate(new Date(game.gameDate));
      const monthGames = gamesCacheRef.current.get(gameMonthKey) ?? [];
      const updatedMonthGames = monthGames.filter((existing) => existing.id !== game.id);
      updatedMonthGames.push(game);
      updatedMonthGames.sort(sortGamesAscending);
      gamesCacheRef.current.set(gameMonthKey, updatedMonthGames);

      refreshGamesForLastRange();
    },
    [getMonthKeyFromDate, pruneGameFromCache, refreshGamesForLastRange],
  );

  const removeGameFromCache = useCallback(
    (gameId: string) => {
      const removed = pruneGameFromCache(gameId);
      if (!removed) {
        return;
      }

      refreshGamesForLastRange();
    },
    [pruneGameFromCache, refreshGamesForLastRange],
  );

  const filteredGames = games;

  return {
    games,
    teams,
    fields,
    umpires,
    leagues,
    leagueTeams,
    leagueTeamsCache,
    loadingGames,
    loadingStaticData,
    error,
    success,
    loadStaticData,
    loadGamesData,
    loadLeagueTeams,
    loadUmpires,
    clearLeagueTeams,
    setSuccess,
    setError,
    upsertGameInCache,
    removeGameFromCache,
    filteredGames,
    startDate,
    endDate,
  };
};
