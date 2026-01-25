import { useState, useEffect, useRef, useReducer } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrentSeason } from './useCurrentSeason';
import { createUserManagementService } from '../services/userManagementService';
import { createContextDataService } from '../services/contextDataService';
import { getRoleDisplayName } from '../utils/roleUtils';
import { FeedbackState, Role, UseUserManagementReturn } from '../types/users';
import { useUserDataManager } from './useUserDataManager';
import {
  BaseContactType,
  ContactFilterFieldType,
  ContactFilterOpType,
  ContactRoleType,
  ContactType,
  LeagueSeasonType,
  RoleWithContactType,
  TeamManagerWithTeamsType,
  TeamSeasonType,
} from '@draco/shared-schemas';
import { UserFilterState, UserSortState } from '../types/userFilters';

// Pagination state for atomic updates
interface PaginationState {
  users: ContactType[];
  loading: boolean;
  isInitialLoad: boolean;
  isPaginating: boolean;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type PaginationAction =
  | { type: 'START_LOADING' }
  | { type: 'START_PAGINATION'; page: number }
  | { type: 'SET_DATA'; users: ContactType[]; hasNext: boolean; hasPrev: boolean; page?: number }
  | { type: 'RESET_TO_INITIAL' };

// Reducer for atomic pagination state updates
const paginationReducer = (state: PaginationState, action: PaginationAction): PaginationState => {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        loading: true,
        isInitialLoad: state.users.length === 0, // Only true if no users yet
        isPaginating: false,
      };
    case 'START_PAGINATION':
      return {
        ...state,
        loading: true,
        isInitialLoad: false, // Never show full loading for pagination
        isPaginating: true,
        page: action.page,
      };
    case 'SET_DATA':
      return {
        ...state,
        users: action.users,
        hasNext: action.hasNext,
        hasPrev: action.hasPrev,
        page: action.page !== undefined ? action.page : state.page,
        loading: false,
        isInitialLoad: false,
        isPaginating: false,
      };
    case 'RESET_TO_INITIAL':
      return {
        users: [],
        loading: true,
        isInitialLoad: true,
        isPaginating: false,
        page: 1,
        hasNext: false,
        hasPrev: false,
      };
    default:
      return state;
  }
};

/**
 * Custom hook for user management functionality
 * Centralizes all state and logic for user management operations
 */
export const useUserManagement = (accountId: string): UseUserManagementReturn => {
  const { token } = useAuth();
  const { currentSeasonId, fetchCurrentSeason } = useCurrentSeason(accountId);

  // Pagination state using reducer for atomic updates
  const [paginationState, dispatch] = useReducer(paginationReducer, {
    users: [],
    loading: true,
    isInitialLoad: true,
    isPaginating: false,
    page: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Other state
  const [roles, setRoles] = useState<Role[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);

  // Filter state
  const [onlyWithRoles, setOnlyWithRoles] = useState(false);

  // Advanced filter state
  const [filter, setFilter] = useState<UserFilterState>({
    filterField: '',
    filterOp: '',
    filterValue: '',
  });
  const [hasActiveFilter, setHasActiveFilter] = useState(false);

  // Sort state
  const [sort, setSort] = useState<UserSortState>({
    sortBy: 'lastname',
    sortDirection: 'asc',
  });

  // Initialization guard
  const [initialized, setInitialized] = useState(false);
  const rowsPerPageRef = useRef(rowsPerPage);

  // Extract values from reducer state
  const { users, loading, isInitialLoad, isPaginating, page, hasNext, hasPrev } = paginationState;

  // Dialog states
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ContactType | null>(null);
  const [selectedContactForDelete, setSelectedContactForDelete] = useState<ContactType | null>(
    null,
  );

  // Context data states
  const [leagues, setLeagues] = useState<LeagueSeasonType[]>([]);
  const [teams, setTeams] = useState<TeamSeasonType[]>([]);
  const [leagueSeasons, setLeagueSeasons] = useState<LeagueSeasonType[]>([]);
  const [contextDataLoading, setContextDataLoading] = useState(false);

  // Automatic role holders state
  const [accountOwner, setAccountOwner] = useState<BaseContactType | null>(null); // Initialize as null, but will be set once loaded
  const [teamManagers, setTeamManagers] = useState<TeamManagerWithTeamsType[]>([]);
  const [automaticRolesLoading, setAutomaticRolesLoading] = useState(false);

  // Service instances
  const userService = token ? createUserManagementService(token) : null;
  const contextDataService = token ? createContextDataService(token) : null;

  // New architecture hooks
  const dataManager = useUserDataManager(dispatch);

  // Helper to set error feedback
  const setFeedbackError = (message: string | null) => {
    if (message === null) {
      setFeedback(null);
    } else {
      setFeedback({ severity: 'error', message });
    }
  };

  // Atomic pagination data update using reducer
  const updatePaginationData = (
    newUsers: ContactType[],
    newHasNext: boolean,
    newHasPrev: boolean,
    newPage?: number,
  ) => {
    dispatch({
      type: 'SET_DATA',
      users: newUsers,
      hasNext: newHasNext,
      hasPrev: newHasPrev,
      page: newPage,
    });
  };

  // Load users with pagination
  const loadUsers = async (
    currentPage = 1,
    limit?: number,
    isPaginating = false,
    onlyWithRolesOverride?: boolean,
  ) => {
    if (!userService || !accountId) return;

    try {
      // Use START_PAGINATION for page changes, START_LOADING for initial loads
      if (isPaginating) {
        dispatch({ type: 'START_PAGINATION', page: currentPage });
      } else {
        dispatch({ type: 'START_LOADING' });
      }

      const response = await userService.searchUsers(
        accountId,
        '', // Empty query for list-all functionality
        currentSeasonId,
        onlyWithRolesOverride !== undefined ? onlyWithRolesOverride : onlyWithRoles,
        {
          page: currentPage, // Backend uses 1-based pagination
          limit: limit || rowsPerPageRef.current,
          sortBy: sort.sortBy,
          sortOrder: sort.sortDirection,
        },
      );

      // Atomic state update via reducer
      // When paginating, the page has already been set by START_PAGINATION
      updatePaginationData(
        response.users,
        response.pagination.hasNext ?? false,
        response.pagination.hasPrev ?? false,
        isPaginating ? undefined : currentPage,
      );
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to load users');
      dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
    }
  };

  // Load users with explicit season ID (for initialization)
  const loadUsersWithSeason = async (seasonId: string | null, currentPage = 1, limit?: number) => {
    if (!userService || !accountId) return;

    try {
      dispatch({ type: 'START_LOADING' });
      setFeedbackError(null);

      const response = await userService.searchUsers(
        accountId,
        '', // Empty query for list-all functionality
        seasonId,
        onlyWithRoles,
        {
          page: currentPage, // Backend uses 1-based pagination
          limit: limit || rowsPerPageRef.current,
          sortBy: sort.sortBy,
          sortOrder: sort.sortDirection,
        },
      );

      dispatch({
        type: 'SET_DATA',
        users: response.users,
        hasNext: response.pagination.hasNext ?? false,
        hasPrev: response.pagination.hasPrev ?? false,
      });
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to load users');
      dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
    }
  };

  // Load roles
  const loadRoles = async () => {
    if (!userService) return;

    try {
      const rolesData = await userService.fetchRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };
  // Load automatic role holders
  const loadAutomaticRoleHolders = async () => {
    if (!userService) return;

    try {
      setAutomaticRolesLoading(true);
      setFeedbackError(null);

      const automaticRoleHolders = await userService.fetchAutomaticRoleHolders(accountId);
      setAccountOwner(automaticRoleHolders.accountOwner);
      setTeamManagers(automaticRoleHolders.teamManagers);
    } catch (err) {
      console.error('Failed to load automatic role holders:', err);
      setFeedbackError(
        err instanceof Error ? err.message : 'Failed to load automatic role holders',
      );
    } finally {
      setAutomaticRolesLoading(false);
    }
  };

  // Update ref when rowsPerPage changes
  useEffect(() => {
    rowsPerPageRef.current = rowsPerPage;
  }, [rowsPerPage]);

  // Refs for initialization functions
  const loadUsersWithSeasonRef = useRef(loadUsersWithSeason);
  const loadRolesRef = useRef(loadRoles);
  const loadAutomaticRoleHoldersRef = useRef(loadAutomaticRoleHolders);
  const fetchCurrentSeasonRef = useRef(fetchCurrentSeason);
  loadUsersWithSeasonRef.current = loadUsersWithSeason;
  loadRolesRef.current = loadRoles;
  loadAutomaticRoleHoldersRef.current = loadAutomaticRoleHolders;
  fetchCurrentSeasonRef.current = fetchCurrentSeason;

  // Initialize data
  useEffect(() => {
    if (token && accountId && !initialized) {
      // Fetch current season first, then load users and roles
      fetchCurrentSeasonRef
        .current()
        .then((seasonId) => {
          // Load users with the fetched season ID
          loadUsersWithSeasonRef.current(seasonId);
          loadRolesRef.current();
          loadAutomaticRoleHoldersRef.current();
          setInitialized(true);
        })
        .catch((err) => {
          console.error('Failed to fetch current season:', err);
          // Still load users and roles even if season fetch fails
          loadUsersWithSeasonRef.current(null);
          loadRolesRef.current();
          loadAutomaticRoleHoldersRef.current();
          setInitialized(true);
        });
    }
  }, [token, accountId, initialized]);

  // Search handler - preserves advanced filter if active
  const handleSearch = async () => {
    if (!userService || !accountId) return;

    try {
      setSearchLoading(true);
      setFeedbackError(null);

      if (!searchTerm.trim()) {
        // If search is empty, clear search results and load all users
        setIsShowingSearchResults(false);
        await loadUsers(1);
      } else {
        // Use the search endpoint with pagination, including advanced filter if active
        const searchResponse = await userService.searchUsers(
          accountId,
          searchTerm,
          currentSeasonId,
          onlyWithRoles,
          {
            page: 1, // Backend uses 1-based pagination
            limit: rowsPerPageRef.current,
            sortBy: sort.sortBy,
            sortOrder: sort.sortDirection,
          },
          hasActiveFilter && filter.filterField && filter.filterOp
            ? {
                filterField: filter.filterField as ContactFilterFieldType,
                filterOp: filter.filterOp as ContactFilterOpType,
                filterValue: filter.filterValue,
              }
            : undefined,
        );

        setIsShowingSearchResults(true);
        dispatch({
          type: 'SET_DATA',
          users: searchResponse.users,
          hasNext: searchResponse.pagination.hasNext ?? false,
          hasPrev: searchResponse.pagination.hasPrev ?? false,
          page: 1,
        });
      }
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  // Clear search handler
  const handleClearSearch = async () => {
    if (!userService || !accountId) return;

    try {
      setSearchLoading(true);
      setFeedbackError(null);

      // Clear search term and search results state
      setSearchTerm('');
      setIsShowingSearchResults(false);

      // Reset to first page and load default data
      await loadUsers(1, undefined, true);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to clear search');
    } finally {
      setSearchLoading(false);
    }
  };

  // Filter toggle handler (With Roles only)
  const handleFilterToggle = async (filterValue: boolean) => {
    if (!userService || !accountId) return;

    try {
      dataManager.setLoading();
      setFeedbackError(null);

      // Update filter state
      setOnlyWithRoles(filterValue);

      // Use userService.searchUsers to include advanced filter if active
      const response = await userService.searchUsers(
        accountId,
        searchTerm.trim() || '',
        currentSeasonId,
        filterValue,
        {
          page: 1, // Backend uses 1-based pagination
          limit: rowsPerPageRef.current,
          sortBy: sort.sortBy,
          sortOrder: sort.sortDirection,
        },
        hasActiveFilter && filter.filterField && filter.filterOp
          ? {
              filterField: filter.filterField as ContactFilterFieldType,
              filterOp: filter.filterOp as ContactFilterOpType,
              filterValue: filter.filterValue,
            }
          : undefined,
      );
      dataManager.setData(
        response.users,
        response.pagination.hasNext ?? false,
        response.pagination.hasPrev ?? false,
        1,
      );
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to apply filter');
      dataManager.clearData();
    }
  };

  // Advanced filter handlers
  const handleFilterChange = (newFilter: UserFilterState) => {
    setFilter(newFilter);
  };

  const handleApplyFilter = async () => {
    if (!userService || !accountId) return;
    if (!filter.filterField || !filter.filterOp || !filter.filterValue.trim()) return;

    try {
      dataManager.setLoading();
      setFeedbackError(null);

      const response = await userService.searchUsers(
        accountId,
        searchTerm,
        currentSeasonId,
        onlyWithRoles,
        {
          page: 1,
          limit: rowsPerPageRef.current,
          sortBy: sort.sortBy,
          sortOrder: sort.sortDirection,
        },
        {
          filterField: filter.filterField as ContactFilterFieldType,
          filterOp: filter.filterOp as ContactFilterOpType,
          filterValue: filter.filterValue,
        },
      );

      setHasActiveFilter(true);
      dataManager.setData(
        response.users,
        response.pagination.hasNext ?? false,
        response.pagination.hasPrev ?? false,
        1,
      );
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to apply filter');
      dataManager.clearData();
    }
  };

  const handleClearFilter = async () => {
    if (!userService || !accountId) return;

    try {
      dataManager.setLoading();
      setFeedbackError(null);

      // Reset filter state
      setFilter({
        filterField: '',
        filterOp: '',
        filterValue: '',
      });
      setHasActiveFilter(false);

      // Reload without filter
      const response = await userService.searchUsers(
        accountId,
        searchTerm,
        currentSeasonId,
        onlyWithRoles,
        {
          page: 1,
          limit: rowsPerPageRef.current,
          sortBy: sort.sortBy,
          sortOrder: sort.sortDirection,
        },
      );

      dataManager.setData(
        response.users,
        response.pagination.hasNext ?? false,
        response.pagination.hasPrev ?? false,
        1,
      );
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to clear filter');
      dataManager.clearData();
    }
  };

  // Sort handler
  const handleSortChange = async (newSort: UserSortState) => {
    if (!userService || !accountId) return;

    try {
      setSort(newSort);
      dataManager.setLoading();
      setFeedbackError(null);

      const advancedFilter =
        hasActiveFilter && filter.filterField && filter.filterOp && filter.filterValue
          ? {
              filterField: filter.filterField as ContactFilterFieldType,
              filterOp: filter.filterOp as ContactFilterOpType,
              filterValue: filter.filterValue,
            }
          : undefined;

      const response = await userService.searchUsers(
        accountId,
        searchTerm,
        currentSeasonId,
        onlyWithRoles,
        {
          page: 1,
          limit: rowsPerPageRef.current,
          sortBy: newSort.sortBy,
          sortOrder: newSort.sortDirection,
        },
        advancedFilter,
      );

      dataManager.setData(
        response.users,
        response.pagination.hasNext ?? false,
        response.pagination.hasPrev ?? false,
        1,
      );
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to apply sort');
      dataManager.clearData();
    }
  };

  // Pagination handlers - atomic state updates
  const handleNextPage = async () => {
    if (hasNext && !loading) {
      const nextPage = page + 1;

      // If showing search results or active filter, maintain context
      if ((isShowingSearchResults || hasActiveFilter) && userService) {
        try {
          dispatch({ type: 'START_PAGINATION', page: nextPage });
          setFeedbackError(null);

          const searchResponse = await userService.searchUsers(
            accountId,
            searchTerm,
            currentSeasonId,
            onlyWithRoles,
            {
              page: nextPage, // Backend uses 1-based pagination
              limit: rowsPerPageRef.current,
              sortBy: sort.sortBy,
              sortOrder: sort.sortDirection,
            },
            hasActiveFilter && filter.filterField && filter.filterOp
              ? {
                  filterField: filter.filterField as ContactFilterFieldType,
                  filterOp: filter.filterOp as ContactFilterOpType,
                  filterValue: filter.filterValue,
                }
              : undefined,
          );

          dispatch({
            type: 'SET_DATA',
            users: searchResponse.users,
            hasNext: searchResponse.pagination.hasNext ?? false,
            hasPrev: searchResponse.pagination.hasPrev ?? false,
            page: nextPage,
          });
        } catch (err) {
          setFeedbackError(err instanceof Error ? err.message : 'Failed to load next page');
          dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
        }
      } else {
        // Regular pagination for all users
        loadUsers(nextPage, undefined, true);
      }
    }
  };

  const handlePrevPage = async () => {
    if (hasPrev && !loading) {
      const prevPage = page - 1;

      // If showing search results or active filter, maintain context
      if ((isShowingSearchResults || hasActiveFilter) && userService) {
        try {
          dispatch({ type: 'START_PAGINATION', page: prevPage });
          setFeedbackError(null);

          const searchResponse = await userService.searchUsers(
            accountId,
            searchTerm,
            currentSeasonId,
            onlyWithRoles,
            {
              page: prevPage, // Backend uses 1-based pagination
              limit: rowsPerPageRef.current,
              sortBy: sort.sortBy,
              sortOrder: sort.sortDirection,
            },
            hasActiveFilter && filter.filterField && filter.filterOp
              ? {
                  filterField: filter.filterField as ContactFilterFieldType,
                  filterOp: filter.filterOp as ContactFilterOpType,
                  filterValue: filter.filterValue,
                }
              : undefined,
          );

          dispatch({
            type: 'SET_DATA',
            users: searchResponse.users,
            hasNext: searchResponse.pagination.hasNext ?? false,
            hasPrev: searchResponse.pagination.hasPrev ?? false,
            page: prevPage,
          });
        } catch (err) {
          setFeedbackError(err instanceof Error ? err.message : 'Failed to load previous page');
          dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
        }
      } else {
        // Regular pagination for all users
        loadUsers(prevPage, undefined, true);
      }
    }
  };

  const handleRowsPerPageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);

    // If showing search results or active filter, maintain context
    if ((isShowingSearchResults || hasActiveFilter) && userService) {
      try {
        dispatch({ type: 'START_PAGINATION', page: 1 });
        setFeedbackError(null);

        const searchResponse = await userService.searchUsers(
          accountId,
          searchTerm,
          currentSeasonId,
          onlyWithRoles,
          {
            page: 1, // Backend uses 1-based pagination
            limit: newRowsPerPage,
            sortBy: sort.sortBy,
            sortOrder: sort.sortDirection,
          },
          hasActiveFilter && filter.filterField && filter.filterOp
            ? {
                filterField: filter.filterField as ContactFilterFieldType,
                filterOp: filter.filterOp as ContactFilterOpType,
                filterValue: filter.filterValue,
              }
            : undefined,
        );

        dispatch({
          type: 'SET_DATA',
          users: searchResponse.users,
          hasNext: searchResponse.pagination.hasNext ?? false,
          hasPrev: searchResponse.pagination.hasPrev ?? false,
          page: 1,
        });
      } catch (err) {
        setFeedbackError(err instanceof Error ? err.message : 'Failed to update rows per page');
        dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
      }
    } else {
      // Regular pagination for all users
      loadUsers(1, newRowsPerPage, true);
    }
  };

  // Context data loading function
  const loadContextData = async () => {
    if (!contextDataService || !currentSeasonId) return;

    try {
      setContextDataLoading(true);
      setFeedbackError(null);

      const contextData = await contextDataService.fetchLeaguesAndTeams(accountId, currentSeasonId);

      setLeagueSeasons(contextData.leagueSeasons);
      setLeagues(contextData.leagueSeasons);

      const teamsData = await contextDataService.fetchTeams(accountId, currentSeasonId);
      setTeams(teamsData);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to load context data');
    } finally {
      setContextDataLoading(false);
    }
  };

  // Dialog open handlers

  const openDeleteContactDialog = (contact: ContactType) => {
    setSelectedContactForDelete(contact);
    setDeleteContactDialogOpen(true);
  };

  const closeDeleteContactDialog = () => {
    setDeleteContactDialogOpen(false);
    setSelectedContactForDelete(null);
  };

  // Handle role assignment incremental update
  const handleRoleAssigned = (assignedRole: RoleWithContactType) => {
    const updatedUsers = paginationState.users.map((user) => {
      if (user.id === assignedRole.contact.id) {
        // Convert RoleWithContactType to ContactRoleType for the user's contactroles array
        const newRole: ContactRoleType = {
          id: assignedRole.id,
          roleId: assignedRole.roleId,
          roleName: assignedRole.roleName,
          roleData: assignedRole.roleData,
          contextName: assignedRole.contextName,
        };

        return {
          ...user,
          contactroles: [...(user.contactroles || []), newRole],
        };
      }
      return user;
    });

    // Use existing dispatch pattern (same as handleEditContact, etc.)
    dispatch({
      type: 'SET_DATA',
      users: [...updatedUsers],
      hasNext: paginationState.hasNext,
      hasPrev: paginationState.hasPrev,
      page: paginationState.page,
    });
  };

  // Handle role removal incremental update
  const handleRoleRemoved = (contactId: string, id: string) => {
    const updatedUsers = paginationState.users.map((user) => {
      if (user.id === contactId) {
        return {
          ...user,
          contactroles: (user.contactroles || []).filter((role) => role.id !== id),
        };
      }
      return user;
    });

    // Use existing dispatch pattern
    dispatch({
      type: 'SET_DATA',
      users: [...updatedUsers],
      hasNext: paginationState.hasNext,
      hasPrev: paginationState.hasPrev,
      page: paginationState.page,
    });
  };

  // Handle contact create/update incremental update
  const handleContactUpdated = (contact: ContactType, isCreate: boolean) => {
    if (isCreate) {
      // Reset to loading state and immediately fetch the first page so the UI updates
      dispatch({ type: 'RESET_TO_INITIAL' });
      void loadUsers(1);
    } else {
      // For updates, update the specific contact in the current list
      const updatedUsers = paginationState.users.map((user) => {
        if (user.id === contact.id) {
          return {
            ...user,
            firstName: contact.firstName,
            lastName: contact.lastName,
            middleName: contact.middleName,
            email: contact.email,
            photoUrl: contact.photoUrl,
            contactDetails: contact.contactDetails,
          };
        }
        return user;
      });

      dispatch({
        type: 'SET_DATA',
        users: [...updatedUsers],
        hasNext: paginationState.hasNext,
        hasPrev: paginationState.hasPrev,
        page: paginationState.page,
      });
    }
  };

  // Handle photo deletion incremental update
  const handlePhotoDeleted = (contactId: string) => {
    const updatedUsers = paginationState.users.map((user) => {
      if (user.id === contactId) {
        return {
          ...user,
          photoUrl: undefined,
        };
      }
      return user;
    });

    dispatch({
      type: 'SET_DATA',
      users: [...updatedUsers],
      hasNext: paginationState.hasNext,
      hasPrev: paginationState.hasPrev,
      page: paginationState.page,
    });
  };

  // Handle registration revocation incremental update
  const handleRegistrationRevoked = (contactId: string) => {
    const updatedUsers = paginationState.users.map((user) => {
      if (user.id === contactId) {
        return {
          ...user,
          userId: '', // Clear the userId to indicate no registration
        };
      }
      return user;
    });

    dispatch({
      type: 'SET_DATA',
      users: [...updatedUsers],
      hasNext: paginationState.hasNext,
      hasPrev: paginationState.hasPrev,
      page: paginationState.page,
    });
  };

  const handleRegistrationLinked = (contactId: string, userId: string) => {
    const updatedUsers = paginationState.users.map((user) => {
      if (user.id === contactId) {
        return {
          ...user,
          userId,
        };
      }
      return user;
    });

    dispatch({
      type: 'SET_DATA',
      users: [...updatedUsers],
      hasNext: paginationState.hasNext,
      hasPrev: paginationState.hasPrev,
      page: paginationState.page,
    });
  };

  // Handle contact deletion incremental update
  const handleContactDeleted = (contactId: string) => {
    // Remove the contact from the current list
    const updatedUsers = paginationState.users.filter((user) => user.id !== contactId);

    // If this was the last item on the current page and we're not on page 1, go back one page
    if (updatedUsers.length === 0 && paginationState.page > 1) {
      dispatch({ type: 'RESET_TO_INITIAL' });
    } else {
      dispatch({
        type: 'SET_DATA',
        users: [...updatedUsers],
        hasNext: paginationState.hasNext,
        hasPrev: paginationState.hasPrev,
        page: paginationState.page,
      });
    }
  };

  // Role display name helper - now uses contextName from backend for role display
  const getRoleDisplayNameHelper = (
    roleOrRoleId:
      | string
      | { roleId: string; roleName?: string; roleData?: string; contextName?: string },
  ): string => {
    // Handle both string (roleId) and object (role) parameters for backward compatibility
    if (typeof roleOrRoleId === 'string') {
      return getRoleDisplayName(roleOrRoleId);
    }

    // Pass the full role object to getRoleDisplayName to handle contextName
    return getRoleDisplayName(roleOrRoleId);
  };

  // Stable loading state
  const isCurrentlyLoading = loading;

  return {
    // State
    users,
    roles,
    loading: isCurrentlyLoading, // Use loading state
    isInitialLoad, // Expose initial load state
    feedback,
    page,
    rowsPerPage,
    hasNext,
    hasPrev,
    searchTerm,
    searchLoading,
    isShowingSearchResults,
    onlyWithRoles,
    isPaginating, // Use the state from reducer
    currentSeasonId, // Expose current season ID for export filtering

    // Advanced filter state
    filter,
    hasActiveFilter,

    // Sort state
    sort,

    // Dialog states
    deleteContactDialogOpen,
    selectedUser,
    selectedContactForDelete,

    // Context data states
    leagues,
    teams,
    leagueSeasons,
    contextDataLoading,

    // Automatic role holders states
    accountOwner,
    teamManagers,
    automaticRolesLoading,

    // Actions
    handleSearch,
    handleClearSearch,
    handleFilterToggle,
    handleNextPage,
    handlePrevPage,
    handleRowsPerPageChange,
    openDeleteContactDialog,
    closeDeleteContactDialog,
    setSelectedUser,
    setSearchTerm,
    setFeedback,
    loadContextData,
    getRoleDisplayName: getRoleDisplayNameHelper,
    handleRoleAssigned,
    handleRoleRemoved,
    handleContactUpdated,
    handlePhotoDeleted,
    handleRegistrationRevoked,
    handleRegistrationLinked,
    handleContactDeleted,

    // Advanced filter actions
    handleFilterChange,
    handleApplyFilter,
    handleClearFilter,

    // Sort actions
    handleSortChange,
  };
};
