import { useState, useEffect, useCallback, useRef } from 'react';
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
import { User, Role, UserRole, UseUserManagementReturn } from '../types/users';

/**
 * Custom hook for user management functionality
 * Centralizes all state and logic for user management operations
 */
export const useUserManagement = (accountId: string): UseUserManagementReturn => {
  const { token } = useAuth();
  const { currentSeasonId, fetchCurrentSeason } = useCurrentSeason(accountId);

  // Core state
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Filter state
  const [onlyWithRoles, setOnlyWithRoles] = useState(false);

  // Initialization guard
  const [initialized, setInitialized] = useState(false);
  const rowsPerPageRef = useRef(rowsPerPage);

  // Dialog states
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [removeRoleDialogOpen, setRemoveRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

  // Load users with pagination
  const loadUsers = useCallback(
    async (currentPage = 0, limit?: number) => {
      if (!userService || !accountId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await userService.fetchUsers(accountId, {
          page: currentPage, // Backend uses 1-based pagination
          limit: limit || rowsPerPageRef.current,
          sortBy: 'lastname',
          sortOrder: 'asc',
          seasonId: currentSeasonId,
          onlyWithRoles: onlyWithRoles,
        });

        setUsers(response.users);
        setHasNext(response.pagination.hasNext);
        setHasPrev(response.pagination.hasPrev);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    },
    [userService, accountId, currentSeasonId, onlyWithRoles],
  );

  // Load users with explicit season ID (for initialization)
  const loadUsersWithSeason = useCallback(
    async (seasonId: string | null, currentPage = 0, limit?: number) => {
      if (!userService || !accountId) return;

      try {
        setLoading(true);
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

        setUsers(response.users);
        setHasNext(response.pagination.hasNext);
        setHasPrev(response.pagination.hasPrev);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
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
        setPage(0);
      } else {
        // Use the search endpoint
        const searchResults = await userService.searchUsers(
          accountId,
          searchTerm,
          currentSeasonId,
          onlyWithRoles,
        );
        setUsers(searchResults);
        setHasNext(false); // Search results don't have pagination
        setHasPrev(false);
        setPage(1);
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
      setPage(0);
      await loadUsers(0);
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
        setLoading(true);
        setError(null);

        // Update filter state
        setOnlyWithRoles(filterValue);

        // Reset to first page and reload data with new filter
        setPage(0);

        // If we have a search term, re-run the search with the new filter
        if (searchTerm.trim()) {
          const searchResults = await userService.searchUsers(
            accountId,
            searchTerm,
            currentSeasonId,
            filterValue,
          );
          setUsers(searchResults);
          setHasNext(false);
          setHasPrev(false);
          setPage(1);
        } else {
          // Otherwise reload regular user list with filter
          const response = await userService.fetchUsers(accountId, {
            page: 1,
            limit: rowsPerPageRef.current,
            sortBy: 'lastname',
            sortOrder: 'asc',
            seasonId: currentSeasonId,
            onlyWithRoles: filterValue,
          });
          setUsers(response.users);
          setHasNext(response.pagination.hasNext);
          setHasPrev(response.pagination.hasPrev);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to apply filter');
      } finally {
        setLoading(false);
      }
    },
    [userService, accountId, searchTerm, currentSeasonId],
  );

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (hasNext) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadUsers(nextPage);
    }
  }, [hasNext, page, loadUsers]);

  const handlePrevPage = useCallback(() => {
    if (hasPrev) {
      const prevPage = page - 1;
      setPage(prevPage);
      loadUsers(prevPage);
    }
  }, [hasPrev, page, loadUsers]);

  const handleRowsPerPageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPage(1);
      loadUsers(1, newRowsPerPage);
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

  return {
    // State
    users,
    roles,
    loading,
    error,
    success,
    page,
    rowsPerPage,
    hasNext,
    hasPrev,
    searchTerm,
    searchLoading,
    onlyWithRoles,

    // Dialog states
    assignRoleDialogOpen,
    removeRoleDialogOpen,
    selectedUser,
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
    setAssignRoleDialogOpen,
    setRemoveRoleDialogOpen,
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
