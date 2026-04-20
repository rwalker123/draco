import { useState, useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { useAuth } from '../../../context/AuthContext';
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
import { getCurrentSeason, listSeasonLeagueSeasons } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../utils/apiResult';
import { mapLeagueSetup } from '../../../utils/leagueSeasonMapper';
import { TeamSeasonType } from '@draco/shared-schemas';
import { getSportAdapter } from '../adapters';
import type {
  ScheduleLocation,
  ScheduleOfficial,
  GameDialogProps,
  ScoreEntryDialogProps,
} from '../types/sportAdapter';

interface UseScheduleDataProps {
  accountId: string;
  accountType?: string;
  filterType: FilterType;
  filterDate: Date;
  onError?: (message: string) => void;
}

interface UseScheduleDataReturn {
  games: Game[];
  teams: TeamSeasonType[];
  locations: ScheduleLocation[];
  officials: ScheduleOfficial[];
  leagues: League[];
  leagueTeams: TeamSeasonType[];
  leagueTeamsCache: Map<string, TeamSeasonType[]>;
  loadingGames: boolean;
  loadingStaticData: boolean;
  loadGamesData: () => Promise<void>;
  loadLeagueTeams: (leagueSeasonId: string) => void;
  loadOfficials: () => Promise<void>;
  clearLeagueTeams: () => void;
  upsertGameInCache: (game: Game) => void;
  removeGameFromCache: (gameId: string) => void;
  deleteGame: (game: Game, force?: boolean) => Promise<void>;
  filteredGames: Game[];
  startDate: Date;
  endDate: Date;
  locationLabel: string;
  hasOfficials: boolean;
  officialLabel: string;
  GameDialog: ComponentType<GameDialogProps>;
  ScoreEntryDialog: ComponentType<ScoreEntryDialogProps>;
  /** @deprecated Use locations instead */
  fields: Field[];
  /** @deprecated Use officials instead */
  umpires: Umpire[];
  /** @deprecated Use loadOfficials instead */
  loadUmpires: () => Promise<void>;
}

const sortGamesAscending = (a: Game, b: Game): number => {
  const diff = new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
  if (diff !== 0) {
    return diff;
  }
  return a.id.localeCompare(b.id);
};

const getMonthKeyFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthRangeForKey = (monthKey: string): { start: Date; end: Date } => {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = endOfMonth(start);
  return { start, end };
};

const getMonthKeysForRange = (rangeStart: Date, rangeEnd: Date): string[] => {
  const months = eachMonthOfInterval({
    start: startOfMonth(rangeStart),
    end: startOfMonth(rangeEnd),
  });
  return months.map((monthDate) => getMonthKeyFromDate(monthDate));
};

const collectGamesForRange = (
  gamesCacheRef: React.MutableRefObject<Map<string, Game[]>>,
  rangeStart: Date,
  rangeEnd: Date,
): Game[] => {
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
};

const computeDateRange = (
  filterType: FilterType,
  filterDate: Date,
): { startDate: Date; endDate: Date } => {
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
};

const getOrFetchSeasonId = async (
  apiClient: ReturnType<typeof useApiClient>,
  accountId: string,
  seasonIdRef: React.MutableRefObject<string | null>,
  seasonFetchPromiseRef: React.MutableRefObject<Promise<string> | null>,
): Promise<string> => {
  const cachedId = seasonIdRef.current;
  if (cachedId) return cachedId;

  let promise = seasonFetchPromiseRef.current;
  if (!promise) {
    promise = (async () => {
      const result = await getCurrentSeason({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });
      const season = unwrapApiResult(result, 'Failed to load current season');
      seasonIdRef.current = season.id;
      return season.id;
    })();
    seasonFetchPromiseRef.current = promise;
    promise.finally(() => {
      seasonFetchPromiseRef.current = null;
    });
  }

  return promise;
};

export const useScheduleData = ({
  accountId,
  accountType,
  filterType,
  filterDate,
  onError,
}: UseScheduleDataProps): UseScheduleDataReturn => {
  const { loading: authLoading } = useAuth();
  const apiClient = useApiClient();

  const adapter = getSportAdapter(accountType);

  const [teams, setTeams] = useState<TeamSeasonType[]>([]);
  const [locations, setLocations] = useState<ScheduleLocation[]>([]);
  const [officials, setOfficials] = useState<ScheduleOfficial[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<TeamSeasonType[]>([]);
  const [leagueTeamsCache, setLeagueTeamsCache] = useState<Map<string, TeamSeasonType[]>>(
    new Map(),
  );

  const [games, setGames] = useState<Game[]>([]);
  const gamesCacheRef = useRef<Map<string, Game[]>>(new Map());
  const gamesRequestCacheRef = useRef<Map<string, Promise<Game[]>>>(new Map());
  const lastRangeRef = useRef<{ start: number; end: number } | null>(null);
  const seasonIdRef = useRef<string | null>(null);
  const seasonFetchPromiseRef = useRef<Promise<string> | null>(null);

  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingStaticData, setLoadingStaticData] = useState(true);

  const { startDate, endDate } = computeDateRange(filterType, filterDate);

  useEffect(() => {
    gamesCacheRef.current.clear();
    gamesRequestCacheRef.current.clear();
    lastRangeRef.current = null;
    seasonIdRef.current = null;
    seasonFetchPromiseRef.current = null;
    setGames([]);
  }, [accountId]);

  const pruneGameFromCache = (gameId: string): boolean => {
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
  };

  const refreshGamesForLastRange = () => {
    const range = lastRangeRef.current;
    if (!range) {
      return;
    }

    const start = new Date(range.start);
    const end = new Date(range.end);
    const nextGames = collectGamesForRange(gamesCacheRef, start, end);
    setGames(nextGames);
  };

  const upsertGameInCache = (game: Game) => {
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
  };

  const removeGameFromCache = (gameId: string) => {
    const removed = pruneGameFromCache(gameId);
    if (!removed) {
      return;
    }

    refreshGamesForLastRange();
  };

  const loadLeagueTeams = (leagueSeasonId: string) => {
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
  };

  const clearLeagueTeams = () => {
    setLeagueTeams([]);
  };

  const loadOfficials = async () => {
    if (!adapter.hasOfficials || !adapter.loadOfficials) {
      setOfficials([]);
      return;
    }

    try {
      const loadedOfficials = await adapter.loadOfficials({ accountId, apiClient });
      setOfficials(loadedOfficials);
    } catch (err) {
      console.warn(`Failed to load ${adapter.officialLabel?.toLowerCase() ?? 'officials'}:`, err);
      setOfficials([]);
    }
  };

  const loadGamesData = async () => {
    try {
      setLoadingGames(true);

      const seasonId = await getOrFetchSeasonId(
        apiClient,
        accountId,
        seasonIdRef,
        seasonFetchPromiseRef,
      );

      const monthKeys = getMonthKeysForRange(startDate, endDate);

      if (monthKeys.length === 0) {
        setGames([]);
        lastRangeRef.current = { start: startDate.getTime(), end: endDate.getTime() };
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
            const loadedGames = await adapter.loadGames({
              accountId,
              seasonId,
              startDate: start,
              endDate: end,
              apiClient,
            });

            gamesCacheRef.current.set(monthKey, loadedGames);
            return loadedGames;
          })();

          gamesRequestCacheRef.current.set(monthKey, requestPromise);
          requestPromise.finally(() => {
            gamesRequestCacheRef.current.delete(monthKey);
          });
        }

        return requestPromise;
      });

      await Promise.all(fetchPromises);

      const nextGames = collectGamesForRange(gamesCacheRef, startDate, endDate);
      setGames(nextGames);
      lastRangeRef.current = { start: startDate.getTime(), end: endDate.getTime() };
    } catch (err) {
      console.error('Failed to load games:', err);
      onError?.('Unable to load games. Please refresh the page.');
    } finally {
      setLoadingGames(false);
    }
  };

  const deleteGame = async (game: Game, force?: boolean) => {
    const seasonId = await getOrFetchSeasonId(
      apiClient,
      accountId,
      seasonIdRef,
      seasonFetchPromiseRef,
    );

    await adapter.deleteGame({
      accountId,
      seasonId,
      gameId: game.id,
      force,
      apiClient,
    });
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const controller = new AbortController();

    const runLoadStaticData = async () => {
      try {
        setLoadingStaticData(true);

        const currentSeasonId = await getOrFetchSeasonId(
          apiClient,
          accountId,
          seasonIdRef,
          seasonFetchPromiseRef,
        );
        if (controller.signal.aborted) return;

        try {
          if (adapter.loadTeams) {
            const { leagues: loadedLeagues, leagueTeamsCache: loadedCache } =
              await adapter.loadTeams({ accountId, seasonId: currentSeasonId, apiClient });

            if (controller.signal.aborted) return;
            setLeagues(loadedLeagues);
            setLeagueTeamsCache(loadedCache);

            const uniqueTeams = new Map<string, TeamSeasonType>();
            loadedCache.forEach((teamsForSeason) => {
              teamsForSeason.forEach((team) => {
                if (!uniqueTeams.has(team.id)) {
                  uniqueTeams.set(team.id, team);
                }
              });
            });
            setTeams(Array.from(uniqueTeams.values()));
          } else {
            const leagueResult = await listSeasonLeagueSeasons({
              client: apiClient,
              path: { accountId, seasonId: currentSeasonId },
              query: {
                includeTeams: true,
                includeUnassignedTeams: false,
              },
              throwOnError: false,
            });

            if (controller.signal.aborted) return;

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
          }
        } catch (leagueError) {
          if (controller.signal.aborted) return;
          console.warn('Failed to load leagues:', leagueError);
          setLeagues([]);
          setLeagueTeamsCache(new Map());
          setTeams([]);
        }

        try {
          const loadedLocations = await adapter.loadLocations({
            accountId,
            apiClient,
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          setLocations(loadedLocations);
        } catch (locationsError) {
          if (controller.signal.aborted) return;
          console.warn(`Failed to load ${adapter.locationLabel.toLowerCase()}s:`, locationsError);
          setLocations([]);
        }

        if (controller.signal.aborted) return;
        setOfficials([]);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        console.error('Failed to load static data:', err);
        onError?.('Unable to load schedule data. Please refresh the page.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStaticData(false);
        }
      }
    };

    void runLoadStaticData();

    return () => {
      controller.abort();
    };
  }, [authLoading, accountId, apiClient, adapter, onError]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const controller = new AbortController();
    const { startDate: rangeStart, endDate: rangeEnd } = computeDateRange(filterType, filterDate);

    const runLoadGamesData = async () => {
      try {
        setLoadingGames(true);

        const seasonId = await getOrFetchSeasonId(
          apiClient,
          accountId,
          seasonIdRef,
          seasonFetchPromiseRef,
        );
        if (controller.signal.aborted) return;

        const monthKeys = getMonthKeysForRange(rangeStart, rangeEnd);

        if (monthKeys.length === 0) {
          setGames([]);
          lastRangeRef.current = { start: rangeStart.getTime(), end: rangeEnd.getTime() };
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
              const loadedGames = await adapter.loadGames({
                accountId,
                seasonId,
                startDate: start,
                endDate: end,
                apiClient,
              });

              gamesCacheRef.current.set(monthKey, loadedGames);
              return loadedGames;
            })();

            gamesRequestCacheRef.current.set(monthKey, requestPromise);
            requestPromise.finally(() => {
              gamesRequestCacheRef.current.delete(monthKey);
            });
          }

          return requestPromise;
        });

        await Promise.all(fetchPromises);

        if (controller.signal.aborted) return;

        const nextGames = collectGamesForRange(gamesCacheRef, rangeStart, rangeEnd);
        setGames(nextGames);
        lastRangeRef.current = { start: rangeStart.getTime(), end: rangeEnd.getTime() };
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load games:', err);
        onError?.('Unable to load games. Please refresh the page.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingGames(false);
        }
      }
    };

    void runLoadGamesData();

    return () => {
      controller.abort();
    };
  }, [authLoading, accountId, apiClient, adapter, filterType, filterDate, onError]);

  const filteredGames = games;

  const fields: Field[] = locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    shortName: loc.shortName ?? loc.name,
    comment: '',
    address: loc.address ?? '',
    city: loc.city ?? '',
    state: loc.state ?? '',
    zipCode: loc.zipCode ?? '',
    directions: '',
    rainoutNumber: '',
    latitude: loc.latitude ?? '',
    longitude: loc.longitude ?? '',
  }));

  const umpires: Umpire[] = officials.map((off) => ({
    id: off.id,
    contactId: off.contactId,
    firstName: off.firstName,
    lastName: off.lastName,
    email: off.email,
  }));

  return {
    games,
    teams,
    locations,
    officials,
    leagues,
    leagueTeams,
    leagueTeamsCache,
    loadingGames,
    loadingStaticData,
    loadGamesData,
    loadLeagueTeams,
    loadOfficials,
    clearLeagueTeams,
    upsertGameInCache,
    removeGameFromCache,
    deleteGame,
    filteredGames,
    startDate,
    endDate,
    locationLabel: adapter.locationLabel,
    hasOfficials: adapter.hasOfficials,
    officialLabel: adapter.officialLabel ?? 'Official',
    GameDialog: adapter.GameDialog,
    ScoreEntryDialog: adapter.ScoreEntryDialog,
    fields,
    umpires,
    loadUmpires: loadOfficials,
  };
};
