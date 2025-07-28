import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrentSeason } from './useCurrentSeason';
import { createUserManagementService } from '../services/userManagementService';
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

  // Service instance
  const userService = token ? createUserManagementService(token) : null;

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
    [userService, accountId, currentSeasonId],
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
    [userService, accountId],
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
        const searchResults = await userService.searchUsers(accountId, searchTerm, currentSeasonId);
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
  }, [searchTerm, userService, accountId, currentSeasonId, loadUsers]);

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
    if (!selectedUser || !selectedRole || !newUserContactId || !userService) return;

    try {
      setFormLoading(true);
      setError(null);

      await userService.assignRole(accountId, newUserContactId, selectedRole);

      setSuccess('Role assigned successfully');
      setAssignRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole('');
      setNewUserContactId('');
      loadUsers(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setFormLoading(false);
    }
  }, [selectedUser, selectedRole, newUserContactId, userService, accountId, page, loadUsers]);

  // Role removal handler
  const handleRemoveRole = useCallback(async () => {
    if (!selectedUser || !selectedRoleToRemove || !userService) return;

    try {
      setFormLoading(true);
      setError(null);

      await userService.removeRole(accountId, selectedUser.id, selectedRoleToRemove.roleId);

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

  // Dialog open handlers
  const openAssignRoleDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setAssignRoleDialogOpen(true);
  }, []);

  const openRemoveRoleDialog = useCallback((user: User, role: UserRole) => {
    setSelectedUser(user);
    setSelectedRoleToRemove(role);
    setRemoveRoleDialogOpen(true);
  }, []);

  // Role display name helper
  const getRoleDisplayNameHelper = useCallback((roleId: string): string => {
    return getRoleDisplayName(roleId);
  }, []);

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

    // Dialog states
    assignRoleDialogOpen,
    removeRoleDialogOpen,
    selectedUser,
    selectedRole,
    selectedRoleToRemove,
    newUserContactId,
    formLoading,

    // Actions
    handleSearch,
    handleClearSearch,
    handleNextPage,
    handlePrevPage,
    handleRowsPerPageChange,
    handleAssignRole,
    handleRemoveRole,
    openAssignRoleDialog,
    openRemoveRoleDialog,
    setAssignRoleDialogOpen,
    setRemoveRoleDialogOpen,
    setSelectedUser,
    setSelectedRole,
    setSelectedRoleToRemove,
    setNewUserContactId,
    setSearchTerm,
    setError,
    setSuccess,
    getRoleDisplayName: getRoleDisplayNameHelper,
  };
};
