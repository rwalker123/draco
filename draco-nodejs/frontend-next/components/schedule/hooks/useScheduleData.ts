import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCurrentSeason } from '../../../hooks/useCurrentSeason';
import { useApiClient } from '../../../hooks/useApiClient';
import { Game, Field, Umpire, League, FilterType } from '@/types/schedule';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
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
  // Data
  games: Game[];
  teams: TeamSeasonType[];
  fields: Field[];
  umpires: Umpire[];
  leagues: League[];
  leagueTeams: TeamSeasonType[];
  leagueTeamsCache: Map<string, TeamSeasonType[]>;

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
  loadUmpires: () => Promise<void>;
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
  const { loading: authLoading } = useAuth();
  const { fetchCurrentSeason } = useCurrentSeason(accountId);
  const apiClient = useApiClient();

  // Data states
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<TeamSeasonType[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [umpires, setUmpires] = useState<Umpire[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<TeamSeasonType[]>([]);
  const [leagueTeamsCache, setLeagueTeamsCache] = useState<Map<string, TeamSeasonType[]>>(
    new Map(),
  );

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
        const mapped = mapLeagueSetup(leagueData);

        const newLeagueTeamsCache = new Map<string, TeamSeasonType[]>();
        const processedLeagues = mapped.leagueSeasons.map((leagueSeason) => {
          const leagueTeams: TeamSeasonType[] = [];

          leagueSeason.divisions?.forEach((division) => {
            division.teams.forEach((team) => {
              leagueTeams.push(team);
            });
          });

          leagueSeason.unassignedTeams?.forEach((team) => {
            leagueTeams.push(team);
          });

          newLeagueTeamsCache.set(leagueSeason.id, leagueTeams);

          return {
            id: leagueSeason.id,
            name: leagueSeason.league.name,
          };
        });

        setLeagues(processedLeagues);
        setLeagueTeamsCache(newLeagueTeamsCache);

        const uniqueTeams = new Map<string, TeamSeasonType>();
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
          comment: '',
          address: field.address ?? '',
          city: field.city ?? '',
          state: field.state ?? '',
          zipCode: field.zip ?? '',
          directions: '',
          rainoutNumber: '',
          latitude: '',
          longitude: '',
        }));
        setFields(mappedFields);
      } catch (fieldsError) {
        console.warn('Failed to load fields:', fieldsError);
        setFields([]);
      }

      setUmpires([]);

      setUmpires([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load static data');
    } finally {
      setLoadingStaticData(false);
    }
  }, [accountId, apiClient, fetchCurrentSeason]);

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
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        setUmpires([]);
        return;
      }

      console.warn('Failed to load umpires:', error);
      setUmpires([]);
    }
  }, [accountId, apiClient]);

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
    loadUmpires,
    clearLeagueTeams,
    setSuccess,
    setError,

    // Computed values
    filteredGames,
    startDate,
    endDate,
  };
};
