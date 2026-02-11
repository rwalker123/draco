import { useState, useEffect, useRef } from 'react';
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

export interface UseManagerStateOptions {
  accountId: string;
  seasonId: string;
  initialSearchQuery?: string;
  initialSortBy?: 'name' | 'email' | 'teamCount';
  initialSortOrder?: 'asc' | 'desc';
  pageSize?: number;
  debounceMs?: number;
  enabled?: boolean;
}

export interface ManagerState {
  managers: ManagerInfo[];
  leagueNames: LeagueNames;
  teamNames: TeamNames;

  searchQuery: string;
  sortBy: 'name' | 'email' | 'teamCount';
  sortOrder: 'asc' | 'desc';

  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  filteredManagers: ManagerInfo[];
  sortedManagers: ManagerInfo[];
  paginatedManagers: ManagerInfo[];
  uniqueLeagues: Array<{ id: string; name: string }>;
  uniqueTeams: Array<{ id: string; name: string }>;
  groupedByLeague: Record<string, ManagerInfo[]>;
}

export interface ManagerActions {
  fetchManagers: () => Promise<void>;
  fetchManagersByLeague: (leagueId: string) => Promise<void>;
  fetchManagersByTeam: (teamId: string) => Promise<void>;
  searchManagers: (query: string) => Promise<void>;

  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'name' | 'email' | 'teamCount') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;

  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  setPageSize: (pageSize: number) => void;

  clearError: () => void;
  reset: () => void;
}

export interface UseManagerStateReturn {
  state: ManagerState;
  actions: ManagerActions;
}

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

  const [managers, setManagers] = useState<ManagerInfo[]>([]);
  const [leagueNames, setLeagueNames] = useState<LeagueNames>({});
  const [teamNames, setTeamNames] = useState<TeamNames>({});

  const [searchQuery, setSearchQueryState] = useState(initialSearchQuery);
  const [sortBy, setSortByState] = useState(initialSortBy);
  const [sortOrder, setSortOrderState] = useState(initialSortOrder);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const managerServiceRef = useRef<ManagerService | null>(null);

  const accountIdRef = useRef(accountId);
  const seasonIdRef = useRef(seasonId);

  const currentRequestRef = useRef<{
    id: string;
    controller: AbortController;
    type: 'fetch' | 'search' | 'fetchByLeague' | 'fetchByTeam';
  } | null>(null);

  const filteredManagers = filterManagersByQuery(managers, searchQuery, leagueNames, teamNames);

  const sortedManagers = sortManagers(filteredManagers, sortBy, sortOrder);

  const totalPages = Math.ceil(sortedManagers.length / pageSizeState);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const startIndex = (currentPage - 1) * pageSizeState;
  const endIndex = startIndex + pageSizeState;
  const paginatedManagers = sortedManagers.slice(startIndex, endIndex);

  const uniqueLeagues = getUniqueLeaguesFromManagers(managers, leagueNames);

  const uniqueTeams = getUniqueTeamsFromManagers(managers, teamNames);

  const groupedByLeague = groupManagersByLeague(managers, leagueNames);

  const state: ManagerState = {
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
  };

  useEffect(() => {
    if (token) {
      managerServiceRef.current = createManagerService(token);
    } else {
      managerServiceRef.current = null;
    }
  }, [token]);

  useEffect(() => {
    accountIdRef.current = accountId;
  }, [accountId]);

  useEffect(() => {
    seasonIdRef.current = seasonId;
  }, [seasonId]);

  const fetchManagers = async () => {
    const managerService = managerServiceRef.current;
    const currentAccountId = accountIdRef.current;
    const currentSeasonId = seasonIdRef.current;

    if (!currentAccountId || !currentSeasonId || !managerService) {
      return;
    }

    const requestId = `fetch-${currentAccountId}-${currentSeasonId}`;

    if (
      currentRequestRef.current?.id === requestId &&
      !currentRequestRef.current.controller.signal.aborted
    ) {
      return;
    }

    if (currentRequestRef.current && currentRequestRef.current.id !== requestId) {
      currentRequestRef.current.controller.abort();
    }

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

      if (currentRequest.controller.signal.aborted) {
        return;
      }

      if (currentRequestRef.current?.id !== requestId) {
        return;
      }

      setManagers(result.managers);
      setLeagueNames(result.leagueNames);
      setTeamNames(result.teamNames);
    } catch (err) {
      console.log('🔍 useManagerState: Error in fetchManagers:', err);

      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        console.log('🔍 useManagerState: Request was cancelled, not setting error');
        return;
      }

      if (currentRequestRef.current?.id === requestId) {
        setError(err instanceof Error ? err.message : 'Failed to fetch managers');
      }
    } finally {
      if (
        currentRequestRef.current?.id === requestId &&
        !currentRequest.controller.signal.aborted
      ) {
        setIsLoading(false);
      }
    }
  };

  const fetchManagersByLeague = async (leagueId: string) => {
    const service = managerServiceRef.current;
    if (!accountId || !seasonId || !service) return;

    const requestId = `fetchByLeague-${accountId}-${seasonId}-${leagueId}`;

    if (
      currentRequestRef.current?.id === requestId &&
      !currentRequestRef.current.controller.signal.aborted
    ) {
      return;
    }

    if (currentRequestRef.current && currentRequestRef.current.id !== requestId) {
      currentRequestRef.current.controller.abort();
    }

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

      if (currentRequest.controller.signal.aborted) {
        return;
      }

      if (currentRequestRef.current?.id !== requestId) {
        return;
      }

      setManagers(result.managers);
      setLeagueNames(result.leagueNames);
      setTeamNames(result.teamNames);
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
        return;
      }

      if (currentRequestRef.current?.id === requestId) {
        setError(err instanceof Error ? err.message : 'Failed to fetch managers by league');
      }
    } finally {
      if (
        currentRequestRef.current?.id === requestId &&
        !currentRequest.controller.signal.aborted
      ) {
        setIsLoading(false);
      }
    }
  };

  const fetchManagersByTeam = async (teamId: string) => {
    const service = managerServiceRef.current;
    if (!accountId || !seasonId || !service) return;

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

      if (controller.signal.aborted) {
        return;
      }

      setManagers(result.managers);
      setLeagueNames(result.leagueNames);
      setTeamNames(result.teamNames);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to fetch managers by team');
    } finally {
      setIsLoading(false);
    }
  };

  const searchManagers = async (query: string) => {
    const managerService = managerServiceRef.current;
    if (!accountId || !seasonId || !managerService) return;

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

      if (controller.signal.aborted) {
        return;
      }

      setManagers(result.managers);
      setLeagueNames(result.leagueNames);
      setTeamNames(result.teamNames);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to search managers');
    } finally {
      setIsSearching(false);
    }
  };

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchManagers(query);
      }, debounceMs);
    } else {
      fetchManagers();
    }
  };

  const setSortBy = (newSortBy: 'name' | 'email' | 'teamCount') => {
    setSortByState(newSortBy);
    setCurrentPage(1);
  };

  const setSortOrder = (newSortOrder: 'asc' | 'desc') => {
    setSortOrderState(newSortOrder);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const setPageSize = (newPageSize: number) => {
    setPageSizeState(newPageSize);
    setCurrentPage(1);
  };

  const clearError = () => {
    setError(null);
  };

  const reset = () => {
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
  };

  const actions: ManagerActions = {
    fetchManagers,
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
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    actions,
  };
};
