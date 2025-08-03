import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrentSeason } from './useCurrentSeason';
import { createUserManagementService } from '../services/userManagementService';
import {
  createContextDataService,
  League,
  Team,
  LeagueSeason,
} from '../services/contextDataService';
import { getRoleDisplayName } from '../utils/roleUtils';
import {
  User,
  Role,
  UserRole,
  UseUserManagementReturn,
  Contact,
  ContactUpdateData,
} from '../types/users';

// Pagination state for atomic updates
interface PaginationState {
  users: User[];
  loading: boolean;
  isInitialLoad: boolean;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type PaginationAction =
  | { type: 'START_LOADING' }
  | { type: 'START_PAGINATION'; page: number }
  | { type: 'SET_DATA'; users: User[]; hasNext: boolean; hasPrev: boolean; page?: number }
  | { type: 'RESET_TO_INITIAL' };

// Reducer for atomic pagination state updates
const paginationReducer = (state: PaginationState, action: PaginationAction): PaginationState => {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...state,
        loading: true,
        isInitialLoad: state.users.length === 0, // Only true if no users yet
      };
    case 'START_PAGINATION':
      return {
        ...state,
        loading: true,
        isInitialLoad: false, // Never show full loading for pagination
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
      };
    case 'RESET_TO_INITIAL':
      return {
        users: [],
        loading: true,
        isInitialLoad: true,
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
    page: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Other state
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Filter state
  const [onlyWithRoles, setOnlyWithRoles] = useState(false);

  // Initialization guard
  const [initialized, setInitialized] = useState(false);
  const rowsPerPageRef = useRef(rowsPerPage);

  // Extract values from reducer state
  const { users, loading, isInitialLoad, page, hasNext, hasPrev } = paginationState;

  // Dialog states
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [removeRoleDialogOpen, setRemoveRoleDialogOpen] = useState(false);
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<Contact | null>(null);
  const [selectedContactForDelete, setSelectedContactForDelete] = useState<Contact | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedRoleToRemove, setSelectedRoleToRemove] = useState<UserRole | null>(null);

  // Form states
  const [newUserContactId, setNewUserContactId] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);

  // Context data states
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagueSeasons, setLeagueSeasons] = useState<LeagueSeason[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [contextDataLoading, setContextDataLoading] = useState(false);

  // Service instances
  const userService = token ? createUserManagementService(token) : null;
  const contextDataService = token ? createContextDataService(token) : null;

  // Atomic pagination data update using reducer
  const updatePaginationData = useCallback(
    (newUsers: User[], newHasNext: boolean, newHasPrev: boolean, newPage?: number) => {
      dispatch({
        type: 'SET_DATA',
        users: newUsers,
        hasNext: newHasNext,
        hasPrev: newHasPrev,
        page: newPage,
      });
    },
    [],
  );

  // Load users with pagination
  const loadUsers = useCallback(
    async (currentPage = 0, limit?: number, isPaginating = false) => {
      if (!userService || !accountId) return;

      try {
        // Use START_PAGINATION for page changes, START_LOADING for initial loads
        if (isPaginating) {
          dispatch({ type: 'START_PAGINATION', page: currentPage });
        } else {
          dispatch({ type: 'START_LOADING' });
        }
        setError(null);

        const response = await userService.fetchUsers(accountId, {
          page: currentPage, // Backend uses 1-based pagination
          limit: limit || rowsPerPageRef.current,
          sortBy: 'lastname',
          sortOrder: 'asc',
          seasonId: currentSeasonId,
          onlyWithRoles: onlyWithRoles,
        });

        // Atomic state update via reducer
        // When paginating, the page has already been set by START_PAGINATION
        updatePaginationData(
          response.users,
          response.pagination.hasNext,
          response.pagination.hasPrev,
          isPaginating ? undefined : currentPage,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
      }
    },
    [userService, accountId, currentSeasonId, onlyWithRoles, updatePaginationData],
  );

  // Load users with explicit season ID (for initialization)
  const loadUsersWithSeason = useCallback(
    async (seasonId: string | null, currentPage = 0, limit?: number) => {
      if (!userService || !accountId) return;

      try {
        dispatch({ type: 'START_LOADING' });
        setError(null);

        const params = {
          page: currentPage + 1, // Backend uses 1-based pagination
          limit: limit || rowsPerPageRef.current,
          sortBy: 'lastname',
          sortOrder: 'asc' as const,
          seasonId: seasonId,
          onlyWithRoles: onlyWithRoles,
        };

        const response = await userService.fetchUsers(accountId, params);

        dispatch({
          type: 'SET_DATA',
          users: response.users,
          hasNext: response.pagination.hasNext,
          hasPrev: response.pagination.hasPrev,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
        dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
      }
    },
    [userService, accountId, onlyWithRoles],
  );

  // Load roles
  const loadRoles = useCallback(async () => {
    if (!userService) return;

    try {
      const rolesData = await userService.fetchRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  }, [userService]);

  // Update ref when rowsPerPage changes
  useEffect(() => {
    rowsPerPageRef.current = rowsPerPage;
  }, [rowsPerPage]);

  // Initialize data
  useEffect(() => {
    if (token && accountId && !initialized) {
      // Fetch current season first, then load users and roles
      fetchCurrentSeason()
        .then((seasonId) => {
          // Load users with the fetched season ID
          loadUsersWithSeason(seasonId);
          loadRoles();
          setInitialized(true);
        })
        .catch((err) => {
          console.error('Failed to fetch current season:', err);
          // Still load users and roles even if season fetch fails
          loadUsersWithSeason(null);
          loadRoles();
          setInitialized(true);
        });
    }
  }, [token, accountId, initialized, loadRoles, fetchCurrentSeason, loadUsersWithSeason]);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!userService || !accountId) return;

    try {
      setSearchLoading(true);
      setError(null);

      if (!searchTerm.trim()) {
        // If search is empty, load all users
        await loadUsers(0);
      } else {
        // Use the search endpoint
        const searchResults = await userService.searchUsers(
          accountId,
          searchTerm,
          currentSeasonId,
          onlyWithRoles,
        );
        dispatch({
          type: 'SET_DATA',
          users: searchResults,
          hasNext: false, // Search results don't have pagination
          hasPrev: false,
          page: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, userService, accountId, currentSeasonId, onlyWithRoles, loadUsers]);

  // Clear search handler
  const handleClearSearch = useCallback(async () => {
    if (!userService || !accountId) return;

    try {
      setSearchLoading(true);
      setError(null);

      // Clear search term
      setSearchTerm('');

      // Reset to first page and load default data
      await loadUsers(0, undefined, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear search');
    } finally {
      setSearchLoading(false);
    }
  }, [userService, accountId, loadUsers]);

  // Filter toggle handler
  const handleFilterToggle = useCallback(
    async (filterValue: boolean) => {
      if (!userService || !accountId) return;

      try {
        dispatch({ type: 'START_LOADING' });
        setError(null);

        // Update filter state
        setOnlyWithRoles(filterValue);

        // Reset to first page and reload data with new filter
        // Page will be set by loadUsers with isPaginating=true

        // If we have a search term, re-run the search with the new filter
        if (searchTerm.trim()) {
          const searchResults = await userService.searchUsers(
            accountId,
            searchTerm,
            currentSeasonId,
            filterValue,
          );
          dispatch({
            type: 'SET_DATA',
            users: searchResults,
            hasNext: false,
            hasPrev: false,
            page: 1,
          });
        } else {
          // Otherwise reload regular user list with filter
          await loadUsers(1, undefined, true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to apply filter');
      } finally {
        dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
      }
    },
    [userService, accountId, searchTerm, currentSeasonId],
  );

  // Pagination handlers - atomic state updates
  const handleNextPage = useCallback(() => {
    if (hasNext && !loading) {
      const nextPage = page + 1;
      // Pass isPaginating=true to avoid double dispatch
      loadUsers(nextPage, undefined, true);
    }
  }, [hasNext, page, loadUsers, loading]);

  const handlePrevPage = useCallback(() => {
    if (hasPrev && !loading) {
      const prevPage = page - 1;
      // Pass isPaginating=true to avoid double dispatch
      loadUsers(prevPage, undefined, true);
    }
  }, [hasPrev, page, loadUsers, loading]);

  const handleRowsPerPageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      // Pass isPaginating=true to avoid double dispatch
      loadUsers(1, newRowsPerPage, true);
    },
    [loadUsers],
  );

  // Role assignment handler
  const handleAssignRole = useCallback(async () => {
    if (!selectedRole || !newUserContactId || !userService) return;

    try {
      setFormLoading(true);
      setError(null);

      // Determine the correct roleData based on the role type
      let roleData: string = accountId;
      let needsSeasonId = false;

      // Use the role IDs from roleUtils
      const ROLE_IDS = {
        ACCOUNT_ADMIN: '5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A',
        ACCOUNT_PHOTO_ADMIN: 'a87ea9a3-47e2-49d1-9e1e-c35358d1a677',
        LEAGUE_ADMIN: '672DDF06-21AC-4D7C-B025-9319CC69281A',
        TEAM_ADMIN: '777D771B-1CBA-4126-B8F3-DD7F3478D40E',
        TEAM_PHOTO_ADMIN: '55FD3262-343F-4000-9561-6BB7F658DEB7',
      };

      switch (selectedRole) {
        case ROLE_IDS.LEAGUE_ADMIN:
          if (!selectedLeagueId) {
            throw new Error('Please select a league');
          }
          roleData = selectedLeagueId;
          needsSeasonId = true;
          break;
        case ROLE_IDS.TEAM_ADMIN:
        case ROLE_IDS.TEAM_PHOTO_ADMIN:
          if (!selectedTeamId) {
            throw new Error('Please select a team');
          }
          roleData = selectedTeamId;
          needsSeasonId = true;
          break;
        case ROLE_IDS.ACCOUNT_ADMIN:
        case ROLE_IDS.ACCOUNT_PHOTO_ADMIN:
          roleData = accountId;
          break;
        default:
          // For any other roles, use accountId as default
          roleData = accountId;
      }

      console.log('Attempting to assign role:', {
        accountId,
        contactId: newUserContactId,
        roleId: selectedRole,
        roleData,
        seasonId: needsSeasonId ? currentSeasonId : undefined,
        userService: !!userService,
      });

      await userService.assignRole(
        accountId,
        newUserContactId,
        selectedRole,
        roleData,
        needsSeasonId ? currentSeasonId : undefined,
      );

      setSuccess('Role assigned successfully');
      setAssignRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole('');
      setNewUserContactId('');
      setSelectedLeagueId('');
      setSelectedTeamId('');
      loadUsers(page);
    } catch (err) {
      console.error('Role assignment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setFormLoading(false);
    }
  }, [
    selectedRole,
    newUserContactId,
    userService,
    accountId,
    selectedLeagueId,
    selectedTeamId,
    currentSeasonId,
    page,
    loadUsers,
  ]);

  // Role removal handler
  const handleRemoveRole = useCallback(async () => {
    if (!selectedUser || !selectedRoleToRemove || !userService) return;

    try {
      setFormLoading(true);
      setError(null);

      await userService.removeRole(
        accountId,
        selectedUser.id,
        selectedRoleToRemove.roleId,
        selectedRoleToRemove.roleData,
      );

      setSuccess('Role removed successfully');
      setRemoveRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRoleToRemove(null);
      loadUsers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    } finally {
      setFormLoading(false);
    }
  }, [selectedUser, selectedRoleToRemove, userService, accountId, page, loadUsers]);

  // Context data loading function
  const loadContextData = useCallback(async () => {
    if (!contextDataService || !currentSeasonId) return;

    try {
      setContextDataLoading(true);
      setError(null);

      const contextData = await contextDataService.fetchLeaguesAndTeams(accountId, currentSeasonId);

      setLeagueSeasons(contextData.leagueSeasons);
      setLeagues(
        contextData.leagueSeasons.map((ls) => ({
          id: ls.id,
          leagueId: ls.leagueId,
          leagueName: ls.leagueName,
          accountId: ls.accountId,
        })),
      );

      const teamsData = await contextDataService.fetchTeams(accountId, currentSeasonId);
      setTeams(teamsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load context data');
    } finally {
      setContextDataLoading(false);
    }
  }, [contextDataService, accountId, currentSeasonId]);

  // Dialog open handlers
  const openAssignRoleDialog = useCallback(
    async (user: User) => {
      setSelectedUser(user);
      setNewUserContactId(user.id); // Pre-populate with the user's contact ID
      setAssignRoleDialogOpen(true);
      await loadContextData(); // Load leagues and teams data
    },
    [loadContextData],
  );

  const closeAssignRoleDialog = useCallback(() => {
    setAssignRoleDialogOpen(false);
    setSelectedUser(null);
    setSelectedRole('');
    setNewUserContactId('');
    setSelectedLeagueId('');
    setSelectedTeamId('');
  }, []);

  const openRemoveRoleDialog = useCallback((user: User, role: UserRole) => {
    setSelectedUser(user);
    setSelectedRoleToRemove(role);
    setRemoveRoleDialogOpen(true);
  }, []);

  const openEditContactDialog = useCallback((contact: Contact) => {
    setSelectedContactForEdit(contact);
    setEditContactDialogOpen(true);
  }, []);

  const closeEditContactDialog = useCallback(() => {
    setEditContactDialogOpen(false);
    setSelectedContactForEdit(null);
  }, []);

  const openDeleteContactDialog = useCallback((contact: Contact) => {
    setSelectedContactForDelete(contact);
    setDeleteContactDialogOpen(true);
  }, []);

  const closeDeleteContactDialog = useCallback(() => {
    setDeleteContactDialogOpen(false);
    setSelectedContactForDelete(null);
  }, []);

  const handleEditContact = useCallback(
    async (contactData: ContactUpdateData) => {
      if (!userService || !selectedContactForEdit || !accountId) {
        setError('Unable to update contact - missing required data');
        return;
      }

      try {
        setFormLoading(true);

        await userService.updateContact(accountId, selectedContactForEdit.id, contactData);

        // Refresh the users list to show updated data
        const currentPage = paginationState.page;
        dispatch({ type: 'START_LOADING' });

        const usersResponse = await userService.fetchUsers(accountId, {
          search: searchTerm,
          page: currentPage,
          limit: rowsPerPage,
          seasonId: currentSeasonId,
          onlyWithRoles,
        });

        dispatch({
          type: 'SET_DATA',
          users: usersResponse.users,
          hasNext: usersResponse.pagination.hasNext,
          hasPrev: usersResponse.pagination.hasPrev,
          page: currentPage,
        });

        setSuccess('Contact updated successfully');
        closeEditContactDialog();
      } catch (error) {
        console.error('Error updating contact:', error);
        setError(error instanceof Error ? error.message : 'Failed to update contact');
      } finally {
        setFormLoading(false);
      }
    },
    [
      userService,
      selectedContactForEdit,
      accountId,
      paginationState.page,
      searchTerm,
      rowsPerPage,
      currentSeasonId,
      onlyWithRoles,
      closeEditContactDialog,
    ],
  );

  const handleDeleteContact = useCallback(
    async (contactId: string, force: boolean) => {
      if (!userService || !accountId) {
        setError('Unable to delete contact - missing required data');
        return;
      }

      try {
        setFormLoading(true);

        const result = await userService.deleteContact(accountId, contactId, force);

        // Refresh the users list to remove the deleted contact
        // If we have a search term, use the search functionality to preserve the search state
        if (searchTerm.trim()) {
          // Use the search function which maintains the search state properly
          await handleSearch();
        } else {
          // For regular refresh without search, use the current page but handle empty page edge case
          const currentPage = paginationState.page;
          dispatch({ type: 'START_LOADING' });

          const usersResponse = await userService.fetchUsers(accountId, {
            page: currentPage,
            limit: rowsPerPage,
            seasonId: currentSeasonId,
            onlyWithRoles,
          });

          // If current page is empty and we have previous pages, go back one page
          if (usersResponse.users.length === 0 && currentPage > 1) {
            const previousPageResponse = await userService.fetchUsers(accountId, {
              page: currentPage - 1,
              limit: rowsPerPage,
              seasonId: currentSeasonId,
              onlyWithRoles,
            });

            dispatch({
              type: 'SET_DATA',
              users: previousPageResponse.users,
              hasNext: previousPageResponse.pagination.hasNext,
              hasPrev: previousPageResponse.pagination.hasPrev,
              page: currentPage - 1,
            });
          } else {
            dispatch({
              type: 'SET_DATA',
              users: usersResponse.users,
              hasNext: usersResponse.pagination.hasNext,
              hasPrev: usersResponse.pagination.hasPrev,
              page: currentPage,
            });
          }
        }

        setSuccess(
          `${result.message}${result.dependenciesDeleted > 0 ? ` (${result.dependenciesDeleted} related records deleted)` : ''}`,
        );
        closeDeleteContactDialog();
      } catch (error) {
        console.error('Error deleting contact:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete contact');
      } finally {
        setFormLoading(false);
      }
    },
    [
      userService,
      accountId,
      paginationState.page,
      searchTerm,
      rowsPerPage,
      currentSeasonId,
      onlyWithRoles,
      closeDeleteContactDialog,
    ],
  );

  // Role display name helper - now uses contextName from backend for role display
  const getRoleDisplayNameHelper = useCallback(
    (
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
    },
    [],
  );

  // Memoize stable loading state
  const isCurrentlyLoading = useMemo(() => loading, [loading]);

  return {
    // State
    users,
    roles,
    loading: isCurrentlyLoading, // Use loading state
    isInitialLoad, // Expose initial load state
    error,
    success,
    page,
    rowsPerPage,
    hasNext,
    hasPrev,
    searchTerm,
    searchLoading,
    onlyWithRoles,
    isPaginating: loading && !isInitialLoad, // Show when paginating

    // Dialog states
    assignRoleDialogOpen,
    removeRoleDialogOpen,
    editContactDialogOpen,
    deleteContactDialogOpen,
    selectedUser,
    selectedContactForEdit,
    selectedContactForDelete,
    selectedRole,
    selectedRoleToRemove,
    newUserContactId,
    formLoading,

    // Context data states
    leagues,
    teams,
    leagueSeasons,
    selectedLeagueId,
    selectedTeamId,
    contextDataLoading,

    // Actions
    handleSearch,
    handleClearSearch,
    handleFilterToggle,
    handleNextPage,
    handlePrevPage,
    handleRowsPerPageChange,
    handleAssignRole,
    handleRemoveRole,
    openAssignRoleDialog,
    closeAssignRoleDialog,
    openRemoveRoleDialog,
    openEditContactDialog,
    closeEditContactDialog,
    handleEditContact,
    openDeleteContactDialog,
    closeDeleteContactDialog,
    handleDeleteContact,
    setAssignRoleDialogOpen,
    setRemoveRoleDialogOpen,
    setEditContactDialogOpen,
    setSelectedUser,
    setSelectedRole,
    setSelectedRoleToRemove,
    setNewUserContactId,
    setSelectedLeagueId,
    setSelectedTeamId,
    setSearchTerm,
    setError,
    setSuccess,
    loadContextData,
    getRoleDisplayName: getRoleDisplayNameHelper,
  };
};
