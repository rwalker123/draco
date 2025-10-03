import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCurrentSeason } from '../../../hooks/useCurrentSeason';
import { useApiClient } from '../../../hooks/useApiClient';
import { Game, Team, Field, Umpire, League, FilterType } from '@/types/schedule';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { listSeasonGames, listSeasonLeagueSeasons } from '@draco/shared-api-client';
import { unwrapApiResult } from '../../../utils/apiResult';
import { mapLeagueSetup } from '../../../utils/leagueSeasonMapper';
import { mapGameResponseToScheduleGame } from '../../../utils/gameTransformers';

interface UseScheduleDataProps {
  accountId: string;
  filterType: FilterType;
  filterDate: Date;
}

interface UseScheduleDataReturn {
  // Data
  games: Game[];
  teams: Team[];
  fields: Field[];
  umpires: Umpire[];
  leagues: League[];
  leagueTeams: Team[];
  leagueTeamsCache: Map<string, Team[]>;

  // Loading states
  loadingGames: boolean;
  loadingStaticData: boolean;

  // Error states
  error: string | null;
  success: string | null;

  // Actions
  loadStaticData: () => Promise<void>;
  loadGamesData: () => Promise<void>;
  loadLeagueTeams: (leagueSeasonId: string) => void;
  clearLeagueTeams: () => void;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;

  // Computed values
  filteredGames: Game[];
  startDate: Date;
  endDate: Date;
}

export const useScheduleData = ({
  accountId,
  filterType,
  filterDate,
}: UseScheduleDataProps): UseScheduleDataReturn => {
  const { token, loading: authLoading } = useAuth();
  const { fetchCurrentSeason } = useCurrentSeason(accountId);
  const apiClient = useApiClient();

  // Data states
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [umpires, setUmpires] = useState<Umpire[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<Team[]>([]);
  const [leagueTeamsCache, setLeagueTeamsCache] = useState<Map<string, Team[]>>(new Map());

  // Loading states
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingStaticData, setLoadingStaticData] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate date range based on filter type
  const getDateRange = useCallback(() => {
    let startDate: Date;
    let endDate: Date;

    switch (filterType) {
      case 'day':
        startDate = new Date(filterDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(filterDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = startOfWeek(filterDate);
        endDate = endOfWeek(filterDate);
        break;
      case 'month':
        startDate = startOfMonth(filterDate);
        endDate = endOfMonth(filterDate);
        break;
      case 'year':
        startDate = startOfYear(filterDate);
        endDate = endOfYear(filterDate);
        break;
      default:
        startDate = startOfMonth(filterDate);
        endDate = endOfMonth(filterDate);
    }

    return { startDate, endDate };
  }, [filterType, filterDate]);

  const { startDate, endDate } = getDateRange();

  // Load static data (leagues, fields, umpires)
  const loadStaticData = useCallback(async () => {
    try {
      setLoadingStaticData(true);
      setError('');

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
        const mapped = mapLeagueSetup(leagueData, accountId);

        const newLeagueTeamsCache = new Map<string, Team[]>();
        const processedLeagues = mapped.leagueSeasons.map((leagueSeason) => {
          const leagueTeams: Team[] = [];

          leagueSeason.divisions.forEach((division) => {
            division.teams.forEach((team) => {
              leagueTeams.push({
                id: team.id,
                teamId: team.teamId,
                name: team.name,
                teamName: team.name,
                logoUrl: team.logoUrl ?? undefined,
                webAddress: team.webAddress ?? undefined,
                youtubeUserId: team.youtubeUserId ?? undefined,
                defaultVideo: team.defaultVideo ?? undefined,
                autoPlayVideo: team.autoPlayVideo,
                leagueName: leagueSeason.leagueName,
                divisionName: division.divisionName,
              });
            });
          });

          leagueSeason.unassignedTeams.forEach((team) => {
            leagueTeams.push({
              id: team.id,
              teamId: team.teamId,
              name: team.name,
              teamName: team.name,
              logoUrl: team.logoUrl ?? undefined,
              webAddress: team.webAddress ?? undefined,
              youtubeUserId: team.youtubeUserId ?? undefined,
              defaultVideo: team.defaultVideo ?? undefined,
              autoPlayVideo: team.autoPlayVideo,
              leagueName: leagueSeason.leagueName,
            });
          });

          newLeagueTeamsCache.set(leagueSeason.id, leagueTeams);

          return {
            id: leagueSeason.id,
            name: leagueSeason.leagueName,
          };
        });

        setLeagues(processedLeagues);
        setLeagueTeamsCache(newLeagueTeamsCache);

        const uniqueTeams = new Map<string, Team>();
        newLeagueTeamsCache.forEach((teams) => {
          teams.forEach((team) => {
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

      const fieldsPromise = fetch(`/api/accounts/${accountId}/fields`, {
        headers: { 'Content-Type': 'application/json' },
      });

      const umpirePromise = token
        ? fetch(`/api/accounts/${accountId}/umpires`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          })
        : Promise.resolve(null);

      const [fieldsResponse, umpiresResponse] = await Promise.all([fieldsPromise, umpirePromise]);

      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setFields(fieldsData.fields);
      }

      if (umpiresResponse) {
        if (umpiresResponse.ok) {
          const umpiresData = await umpiresResponse.json();
          setUmpires(umpiresData.umpires);
        } else if (umpiresResponse.status === 401) {
          setUmpires([]);
        } else {
          console.warn('Failed to load umpires:', umpiresResponse.status);
          setUmpires([]);
        }
      } else {
        setUmpires([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load static data');
    } finally {
      setLoadingStaticData(false);
    }
  }, [accountId, apiClient, token, fetchCurrentSeason]);

  // Load games data
  const loadGamesData = useCallback(async () => {
    try {
      // Only show loading spinner on initial load
      if (isInitialLoad) {
        setLoadingGames(true);
      }
      setError('');

      // Get current season first using the hook
      const currentSeasonId = await fetchCurrentSeason();

      // Calculate date range for this specific call
      const { startDate: currentStartDate, endDate: currentEndDate } = getDateRange();

      const gamesResult = await listSeasonGames({
        client: apiClient,
        path: { accountId, seasonId: currentSeasonId },
        query: {
          startDate: currentStartDate.toISOString(),
          endDate: currentEndDate.toISOString(),
          sortOrder: 'asc',
        },
        throwOnError: false,
      });

      const gamesData = unwrapApiResult(gamesResult, 'Failed to load games');
      const transformedGames = gamesData.games.map(mapGameResponseToScheduleGame);

      setGames(transformedGames);

      // Mark initial load as complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoadingGames(false);
    }
  }, [accountId, apiClient, fetchCurrentSeason, getDateRange, isInitialLoad]);

  // Load league teams (from cache)
  const loadLeagueTeams = useCallback(
    (leagueSeasonId: string) => {
      // Clear teams if no league season ID is provided
      if (!leagueSeasonId) {
        setLeagueTeams([]);
        return;
      }

      // Use cached teams instead of making an API call
      const cachedTeams = leagueTeamsCache.get(leagueSeasonId);
      if (cachedTeams) {
        setLeagueTeams(cachedTeams);
      } else {
        setLeagueTeams([]);
      }
    },
    [leagueTeamsCache],
  );

  // Clear league teams
  const clearLeagueTeams = useCallback(() => {
    setLeagueTeams([]);
  }, []);

  // Load static data on mount, but wait for auth to be ready
  useEffect(() => {
    if (!authLoading) {
      loadStaticData();
    }
  }, [loadStaticData, authLoading]);

  // Load games data when filter changes
  useEffect(() => {
    if (filterType && filterDate) {
      loadGamesData();
    }
  }, [filterType, filterDate, loadGamesData]);

  // For now, return all games as filtered games (filtering will be handled by useScheduleFilters)
  const filteredGames = games;

  return {
    // Data
    games,
    teams,
    fields,
    umpires,
    leagues,
    leagueTeams,
    leagueTeamsCache,

    // Loading states
    loadingGames,
    loadingStaticData,

    // Error states
    error,
    success,

    // Actions
    loadStaticData,
    loadGamesData,
    loadLeagueTeams,
    clearLeagueTeams,
    setSuccess,
    setError,

    // Computed values
    filteredGames,
    startDate,
    endDate,
  };
};
