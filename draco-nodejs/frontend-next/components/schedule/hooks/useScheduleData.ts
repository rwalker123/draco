import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCurrentSeason } from '../../../hooks/useCurrentSeason';
import { Game, Team, Field, Umpire, League, FilterType } from '@/types/schedule';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

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

      // Get current season first using the hook
      const currentSeasonId = await fetchCurrentSeason();

      // Load static data in parallel
      const requests = [
        fetch(`/api/accounts/${accountId}/seasons/${currentSeasonId}/leagues?includeTeams`, {
          headers: { 'Content-Type': 'application/json' },
        }),

        fetch(`/api/accounts/${accountId}/fields`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ];

      // Only add umpires request if we have a token
      if (token) {
        console.log('Making umpires request with token:', token ? 'Present' : 'Missing');
        requests.push(
          fetch(`/api/accounts/${accountId}/umpires`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
        );
      } else {
        console.log('Skipping umpires request - no token available');
      }

      const responses = await Promise.all(requests);
      const [leaguesResponse, fieldsResponse, umpiresResponse] = responses;

      // Process leagues for current season (may fail for unauthenticated users)
      if (leaguesResponse.ok) {
        const leaguesData = await leaguesResponse.json();
        const leaguesList = leaguesData.data?.leagueSeasons || [];

        // Build the leagues array and cache teams for each league
        const newLeagueTeamsCache = new Map<string, Team[]>();
        const processedLeagues = leaguesList.map(
          (ls: {
            id: string;
            leagueName: string;
            divisions?: Array<{ teams: Team[] }>;
            unassignedTeams?: Team[];
          }) => {
            const allTeams: Team[] = [];

            // Add teams from divisions
            if (ls.divisions) {
              ls.divisions.forEach((division: { teams: Team[] }) => {
                division.teams.forEach((team: Team) => {
                  allTeams.push({
                    id: team.id,
                    name: team.name,
                  });
                });
              });
            }

            // Add unassigned teams
            if (ls.unassignedTeams) {
              ls.unassignedTeams.forEach((team: Team) => {
                allTeams.push({
                  id: team.id,
                  name: team.name,
                });
              });
            }

            // Cache the teams for this league
            newLeagueTeamsCache.set(ls.id, allTeams);

            return {
              id: ls.id,
              name: ls.leagueName,
            };
          },
        );

        setLeagues(processedLeagues);
        setLeagueTeamsCache(newLeagueTeamsCache);

        // Also set all teams (for backwards compatibility)
        const allTeamsSet = new Set<string>();
        const allTeamsArray: Team[] = [];
        newLeagueTeamsCache.forEach((teams) => {
          teams.forEach((team) => {
            if (!allTeamsSet.has(team.id)) {
              allTeamsSet.add(team.id);
              allTeamsArray.push(team);
            }
          });
        });
        setTeams(allTeamsArray);
      } else if (leaguesResponse.status === 401) {
        // For unauthenticated users, set empty leagues array
        setLeagues([]);
        setLeagueTeamsCache(new Map());
      } else {
        console.warn('Failed to load leagues:', leaguesResponse.status);
        setLeagues([]);
        setLeagueTeamsCache(new Map());
      }

      // Process fields (should work for all users)
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        setFields(fieldsData.data.fields);
      }

      // Process umpires (requires authentication)
      if (umpiresResponse) {
        if (umpiresResponse.ok) {
          const umpiresData = await umpiresResponse.json();
          setUmpires(umpiresData.data.umpires);
        } else if (umpiresResponse.status === 401) {
          // For unauthenticated users, set empty umpires array
          setUmpires([]);
        } else {
          console.warn('Failed to load umpires:', umpiresResponse.status);
          setUmpires([]);
        }
      } else {
        // No token available, set empty umpires array
        setUmpires([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load static data');
    } finally {
      setLoadingStaticData(false);
    }
  }, [accountId, token, fetchCurrentSeason]);

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

      // Load games for the current season (across all leagues)
      const gamesResponse = await fetch(
        `/api/accounts/${accountId}/seasons/${currentSeasonId}/games?startDate=${currentStartDate.toISOString()}&endDate=${currentEndDate.toISOString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!gamesResponse.ok) {
        throw new Error('Failed to load games');
      }

      const gamesData = await gamesResponse.json();
      setGames(gamesData.data.games);

      // Mark initial load as complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoadingGames(false);
    }
  }, [accountId, fetchCurrentSeason, getDateRange, isInitialLoad]);

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
