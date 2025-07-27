import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { isAccountAdministrator } from '../utils/permissionUtils';
import { createUserManagementService } from '../services/userManagementService';
import { getRoleDisplayName } from '../utils/userUtils';
import { 
  User, 
  Role, 
  UserRole, 
  UseUserManagementReturn 
} from '../types/users';

/**
 * Custom hook for user management functionality
 * Centralizes all state and logic for user management operations
 */
export const useUserManagement = (accountId: string): UseUserManagementReturn => {
  const { token } = useAuth();
  const { hasRole } = useRole();

  // Core state
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // Permission check
  const canManageUsers = isAccountAdministrator(hasRole, accountId);

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
          page: currentPage + 1, // Backend uses 1-based pagination
          limit: limit || rowsPerPageRef.current,
          sortBy: 'lastname',
          sortOrder: 'asc',
        });

        setUsers(response.users);
        setTotalUsers(response.total);
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
      loadUsers();
      loadRoles();
      setInitialized(true);
    }
  }, [token, accountId, initialized, loadUsers, loadRoles]);

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
        const searchResults = await userService.searchUsers(accountId, searchTerm);
        setUsers(searchResults);
        setTotalUsers(searchResults.length);
        setPage(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, userService, accountId, loadUsers]);

  // Pagination handlers
  const handlePageChange = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
    loadUsers(newPage);
  }, [loadUsers]);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    loadUsers(0, newRowsPerPage);
  }, [loadUsers]);

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
    return getRoleDisplayName(roleId, roles);
  }, [roles]);

  return {
    // State
    users,
    roles,
    loading,
    error,
    success,
    page,
    rowsPerPage,
    totalUsers,
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
    handlePageChange,
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