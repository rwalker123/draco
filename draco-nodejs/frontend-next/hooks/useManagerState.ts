import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ManagerInfo, LeagueNames, TeamNames } from '../types/emails/recipients';
import { createManagerService, ManagerService } from '../services/managerService';
import { useAuth } from '../context/AuthContext';
import {
  filterManagersByQuery,
  sortManagers,
  groupManagersByLeague,
  getUniqueLeaguesFromManagers,
  getUniqueTeamsFromManagers,
} from '../utils/managerDataTransformers';

/**
 * Manager state management hook
 * Handles manager data fetching, filtering, sorting, and pagination
 */
export interface UseManagerStateOptions {
  accountId: string;
  seasonId: string;
  initialSearchQuery?: string;
  initialSortBy?: 'name' | 'email' | 'teamCount';
  initialSortOrder?: 'asc' | 'desc';
  pageSize?: number;
  debounceMs?: number;
  enabled?: boolean; // Only initialize when enabled
}

export interface ManagerState {
  // Data
  managers: ManagerInfo[];
  leagueNames: LeagueNames;
  teamNames: TeamNames;

  // Filtering and sorting
  searchQuery: string;
  sortBy: 'name' | 'email' | 'teamCount';
  sortOrder: 'asc' | 'desc';

  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  // Computed data
  filteredManagers: ManagerInfo[];
  sortedManagers: ManagerInfo[];
  paginatedManagers: ManagerInfo[];
  uniqueLeagues: Array<{ id: string; name: string }>;
  uniqueTeams: Array<{ id: string; name: string }>;
  groupedByLeague: Record<string, ManagerInfo[]>;
}

export interface ManagerActions {
  // Data fetching
  fetchManagers: () => Promise<void>;
  fetchManagersByLeague: (leagueId: string) => Promise<void>;
  fetchManagersByTeam: (teamId: string) => Promise<void>;
  searchManagers: (query: string) => Promise<void>;

  // Filtering and sorting
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'name' | 'email' | 'teamCount') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;

  // Pagination
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  setPageSize: (pageSize: number) => void;

  // Utility
  clearError: () => void;
  reset: () => void;
}

export interface UseManagerStateReturn {
  state: ManagerState;
  actions: ManagerActions;
}

/**
 * Custom hook for manager state management
 */
export const useManagerState = (options: UseManagerStateOptions): UseManagerStateReturn => {
  const { token } = useAuth();
  const {
    accountId,
    seasonId,
    initialSearchQuery = '',
    initialSortBy = 'name',
    initialSortOrder = 'asc',
    pageSize = 50,
    debounceMs = 300,
  } = options;

  // Data state
  const [managers, setManagers] = useState<ManagerInfo[]>([]);
  const [leagueNames, setLeagueNames] = useState<LeagueNames>({});
  const [teamNames, setTeamNames] = useState<TeamNames>({});

  // Filtering and sorting state
  const [searchQuery, setSearchQueryState] = useState(initialSearchQuery);
  const [sortBy, setSortByState] = useState(initialSortBy);
  const [sortOrder, setSortOrderState] = useState(initialSortOrder);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Stable service reference to prevent dependency cascades
  const managerServiceRef = useRef<ManagerService | null>(null);

  // Parameter refs for stable callback access (accountId/seasonId are static for page lifetime)
  const accountIdRef = useRef(accountId);
  const seasonIdRef = useRef(seasonId);

  // Request tracking for deduplication and smart cancellation
  const currentRequestRef = useRef<{
    id: string;
    controller: AbortController;
    type: 'fetch' | 'search' | 'fetchByLeague' | 'fetchByTeam';
  } | null>(null);

  // Computed filtered managers
  const filteredManagers = useMemo(() => {
    return filterManagersByQuery(managers, searchQuery, leagueNames, teamNames);
  }, [managers, searchQuery, leagueNames, teamNames]);

  // Computed sorted managers
  const sortedManagers = useMemo(() => {
    return sortManagers(filteredManagers, sortBy, sortOrder);
  }, [filteredManagers, sortBy, sortOrder]);

  // Computed pagination
  const totalPages = Math.ceil(sortedManagers.length / pageSizeState);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Computed paginated managers
  const paginatedManagers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSizeState;
    const endIndex = startIndex + pageSizeState;
    return sortedManagers.slice(startIndex, endIndex);
  }, [sortedManagers, currentPage, pageSizeState]);

  // Computed unique leagues and teams
  const uniqueLeagues = useMemo(() => {
    return getUniqueLeaguesFromManagers(managers, leagueNames);
  }, [managers, leagueNames]);

  const uniqueTeams = useMemo(() => {
    return getUniqueTeamsFromManagers(managers, teamNames);
  }, [managers, teamNames]);

  // Computed grouped managers
  const groupedByLeague = useMemo(() => {
    return groupManagersByLeague(managers, leagueNames);
  }, [managers, leagueNames]);

  // State object
  const state: ManagerState = useMemo(
    () => ({
      managers,
      leagueNames,
      teamNames,
      searchQuery,
      sortBy,
      sortOrder,
      currentPage,
      pageSize: pageSizeState,
      totalPages,
      hasNextPage,
      hasPrevPage,
      isLoading,
      isSearching,
      error,
      filteredManagers,
      sortedManagers,
      paginatedManagers,
      uniqueLeagues,
      uniqueTeams,
      groupedByLeague,
    }),
    [
      managers,
      leagueNames,
      teamNames,
      searchQuery,
      sortBy,
      sortOrder,
      currentPage,
      pageSizeState,
      totalPages,
      hasNextPage,
      hasPrevPage,
      isLoading,
      isSearching,
      error,
      filteredManagers,
      sortedManagers,
      paginatedManagers,
      uniqueLeagues,
      uniqueTeams,
      groupedByLeague,
    ],
  );

  // Update stable service reference without causing dependency cascades
  useEffect(() => {
    if (token) {
      managerServiceRef.current = createManagerService(token);
    } else {
      managerServiceRef.current = null;
    }
  }, [token]);

  // Update parameter refs without causing callback recreations
  useEffect(() => {
    accountIdRef.current = accountId;
  }, [accountId]);

  useEffect(() => {
    seasonIdRef.current = seasonId;
  }, [seasonId]);

  // Data fetching actions
  const fetchManagers = useCallback(async () => {
    const managerService = managerServiceRef.current;
    const currentAccountId = accountIdRef.current;
    const currentSeasonId = seasonIdRef.current;

    // Check if we have all required parameters
    if (!currentAccountId || !currentSeasonId || !managerService) {
      return;
    }

    // Generate request ID for deduplication
    const requestId = `fetch-${currentAccountId}-${currentSeasonId}`;

    // Check if we already have an ongoing request with same parameters
    if (
      currentRequestRef.current?.id === requestId &&
      !currentRequestRef.current.controller.signal.aborted
    ) {
      return;
    }

    // Cancel previous request only if parameters changed
    if (currentRequestRef.current && currentRequestRef.current.id !== requestId) {
      currentRequestRef.current.controller.abort();
    }

    // Create new request tracking
    currentRequestRef.current = {
      id: requestId,
      controller: new AbortController(),
      type: 'fetch',
    };

    const currentRequest = currentRequestRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const result = await managerService.fetchManagers(
        currentAccountId,
        currentSeasonId,
        currentRequest.controller.signal,
      );

      // Check if this specific request was cancelled
      if (currentRequest.controller.signal.aborted) {
        return;
      }

      // Verify this is still the current request (prevent race conditions)
      if (currentRequestRef.current?.id !== requestId) {
        return;
      }

      setManagers(result.managers);
      setLeagueNames(result.leagueNames);
      setTeamNames(result.teamNames);
    } catch (err) {
      console.log('🔍 useManagerState: Error in fetchManagers:', err);

      // Don't set error if request was cancelled
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        console.log('🔍 useManagerState: Request was cancelled, not setting error');
        return;
      }

      // Only set error if this is still the current request
      if (currentRequestRef.current?.id === requestId) {
        setError(err instanceof Error ? err.message : 'Failed to fetch managers');
      }
    } finally {
      // Only update loading state if this is still the current request
      if (
        currentRequestRef.current?.id === requestId &&
        !currentRequest.controller.signal.aborted
      ) {
        setIsLoading(false);
      }
    }
  }, []); // Empty dependencies - stable callback using refs for accountId/seasonId

  const fetchManagersByLeague = useCallback(
    async (leagueId: string) => {
      const service = managerServiceRef.current;
      if (!accountId || !seasonId || !service) return;

      // Generate request ID for deduplication
      const requestId = `fetchByLeague-${accountId}-${seasonId}-${leagueId}`;

      // Check if we already have an ongoing request with same parameters
      if (
        currentRequestRef.current?.id === requestId &&
        !currentRequestRef.current.controller.signal.aborted
      ) {
        return;
      }

      // Cancel previous request only if parameters changed
      if (currentRequestRef.current && currentRequestRef.current.id !== requestId) {
        currentRequestRef.current.controller.abort();
      }

      // Create new request tracking
      currentRequestRef.current = {
        id: requestId,
        controller: new AbortController(),
        type: 'fetchByLeague',
      };

      const currentRequest = currentRequestRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.fetchManagersByLeague(
          accountId,
          seasonId,
          leagueId,
          currentRequest.controller.signal,
        );

        // Check if this specific request was cancelled
        if (currentRequest.controller.signal.aborted) {
          return;
        }

        // Verify this is still the current request
        if (currentRequestRef.current?.id !== requestId) {
          return;
        }

        setManagers(result.managers);
        setLeagueNames(result.leagueNames);
        setTeamNames(result.teamNames);
      } catch (err) {
        // Don't set error if request was cancelled
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return;
        }

        // Only set error if this is still the current request
        if (currentRequestRef.current?.id === requestId) {
          setError(err instanceof Error ? err.message : 'Failed to fetch managers by league');
        }
      } finally {
        // Only update loading state if this is still the current request
        if (
          currentRequestRef.current?.id === requestId &&
          !currentRequest.controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    },
    [accountId, seasonId],
  );

  const fetchManagersByTeam = useCallback(
    async (teamId: string) => {
      const service = managerServiceRef.current;
      if (!accountId || !seasonId || !service) return;

      // Use simple abort controller for now (will be updated to new pattern later)
      const controller = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.fetchManagersByTeam(
          accountId,
          seasonId,
          teamId,
          controller.signal,
        );

        // Check if component was unmounted during request
        if (controller.signal.aborted) {
          return;
        }

        setManagers(result.managers);
        setLeagueNames(result.leagueNames);
        setTeamNames(result.teamNames);
      } catch (err) {
        // Don't set error if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to fetch managers by team');
      } finally {
        setIsLoading(false);
      }
    },
    [accountId, seasonId],
  );

  const searchManagers = useCallback(
    async (query: string) => {
      const managerService = managerServiceRef.current;
      if (!accountId || !seasonId || !managerService) return;

      // Use simple abort controller for now (will be updated to new pattern later)
      const controller = new AbortController();

      setIsSearching(true);
      setError(null);

      try {
        const result = await managerService.searchManagers(
          accountId,
          seasonId,
          query,
          controller.signal,
        );

        // Check if component was unmounted during request
        if (controller.signal.aborted) {
          return;
        }

        setManagers(result.managers);
        setLeagueNames(result.leagueNames);
        setTeamNames(result.teamNames);
      } catch (err) {
        // Don't set error if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to search managers');
      } finally {
        setIsSearching(false);
      }
    },
    [accountId, seasonId],
  );

  // Debounced search query setter
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounced search
      if (query.trim()) {
        searchTimeoutRef.current = setTimeout(() => {
          searchManagers(query);
        }, debounceMs);
      } else {
        // If query is empty, fetch all managers
        fetchManagers();
      }
    },
    [searchManagers, fetchManagers, debounceMs],
  );

  // Sorting actions
  const setSortBy = useCallback((newSortBy: 'name' | 'email' | 'teamCount') => {
    setSortByState(newSortBy);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  const setSortOrder = useCallback((newSortOrder: 'asc' | 'desc') => {
    setSortOrderState(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  // Pagination actions
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages],
  );

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  // Utility actions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setManagers([]);
    setLeagueNames({});
    setTeamNames({});
    setSearchQueryState(initialSearchQuery);
    setSortByState(initialSortBy);
    setSortOrderState(initialSortOrder);
    setCurrentPage(1);
    setPageSizeState(pageSize);
    setIsLoading(false);
    setIsSearching(false);
    setError(null);
  }, [initialSearchQuery, initialSortBy, initialSortOrder, pageSize]);

  // Use useRef to maintain stable action references
  const actionsRef = useRef<ManagerActions | null>(null);

  // Create stable actions object
  const actions: ManagerActions = useMemo(() => {
    const newActions = {
      // Data fetching actions
      fetchManagers,
      fetchManagersByLeague,
      fetchManagersByTeam,
      searchManagers,

      // Filtering and sorting actions
      setSearchQuery,
      setSortBy,
      setSortOrder,

      // Pagination actions
      goToPage,
      goToNextPage,
      goToPrevPage,
      setPageSize,

      // Utility actions
      clearError,
      reset,
    };

    // Store reference for stability
    actionsRef.current = newActions;
    return newActions;
  }, [
    // fetchManagers removed - now stable with empty dependencies
    fetchManagersByLeague,
    fetchManagersByTeam,
    searchManagers,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    goToPage,
    goToNextPage,
    goToPrevPage,
    setPageSize,
    clearError,
    reset,
  ]);

  // Cleanup timeout on unmount (but let ongoing requests complete)
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Remove aggressive request cancellation - let requests complete naturally
      // Smart request deduplication already prevents duplicate requests
    };
  }, []);

  return {
    state,
    actions,
  };
};
