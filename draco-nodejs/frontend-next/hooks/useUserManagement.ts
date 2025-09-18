import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { useCurrentSeason } from './useCurrentSeason';
import { createUserManagementService } from '../services/userManagementService';
import {
  createContextDataService,
  League,
  Team,
  LeagueSeason,
} from '../services/contextDataService';
import { getRoleDisplayName } from '../utils/roleUtils';
import { addCacheBuster } from '../config/contacts';
import { Role, UseUserManagementReturn } from '../types/users';
import { extractErrorMessage } from '../types/userManagementTypeGuards';
import { useUserDataManager } from './useUserDataManager';
import { useUserApiOperations } from './useUserApiOperations';
import { Contact, ContactRoleType, ContactType, CreateContactType } from '@draco/shared-schemas';
import { updateContact as apiUpdateContact } from '@draco/shared-api-client';

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
  const apiClient = useApiClient();
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);

  // Filter state
  const [onlyWithRoles, setOnlyWithRoles] = useState(false);

  // Initialization guard
  const [initialized, setInitialized] = useState(false);
  const rowsPerPageRef = useRef(rowsPerPage);

  // Extract values from reducer state
  const { users, loading, isInitialLoad, isPaginating, page, hasNext, hasPrev } = paginationState;

  // Dialog states
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [removeRoleDialogOpen, setRemoveRoleDialogOpen] = useState(false);
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [createContactDialogOpen, setCreateContactDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ContactType | null>(null);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<Contact | null>(null);
  const [selectedContactForDelete, setSelectedContactForDelete] = useState<Contact | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedRoleToRemove, setSelectedRoleToRemove] = useState<ContactRoleType | null>(null);

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

  // Automatic role holders state
  const [accountOwner, setAccountOwner] = useState<{
    contactId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl?: string;
  } | null>(null); // Initialize as null, but will be set once loaded
  const [teamManagers, setTeamManagers] = useState<
    Array<{
      contactId: string;
      firstName: string;
      lastName: string;
      email: string | null;
      photoUrl?: string;
      teams: Array<{
        teamSeasonId: string;
        teamName: string;
      }>;
    }>
  >([]);
  const [automaticRolesLoading, setAutomaticRolesLoading] = useState(false);

  // Service instances
  const userService = token ? createUserManagementService(token) : null;
  const contextDataService = token ? createContextDataService(token) : null;

  // New architecture hooks
  const dataManager = useUserDataManager(dispatch);
  const apiOperations = useUserApiOperations(userService!, accountId);

  // Atomic pagination data update using reducer
  const updatePaginationData = useCallback(
    (newUsers: ContactType[], newHasNext: boolean, newHasPrev: boolean, newPage?: number) => {
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
    async (
      currentPage = 0,
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
        setError(null);

        const response = await userService.fetchUsers(accountId, {
          page: currentPage, // Backend uses 1-based pagination
          limit: limit || rowsPerPageRef.current,
          sortBy: 'lastname',
          sortOrder: 'asc',
          seasonId: currentSeasonId,
          onlyWithRoles:
            onlyWithRolesOverride !== undefined ? onlyWithRolesOverride : onlyWithRoles,
        });

        // Atomic state update via reducer
        // When paginating, the page has already been set by START_PAGINATION
        updatePaginationData(
          response.users,
          response.pagination.hasNext ?? false,
          response.pagination.hasPrev ?? false,
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
          hasNext: response.pagination.hasNext ?? false,
          hasPrev: response.pagination.hasPrev ?? false,
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
  // Load automatic role holders
  const loadAutomaticRoleHolders = useCallback(async () => {
    if (!userService) return;

    try {
      setAutomaticRolesLoading(true);
      setError(null);

      const automaticRoleHolders = await userService.fetchAutomaticRoleHolders(accountId);
      setAccountOwner(automaticRoleHolders.accountOwner);
      setTeamManagers(automaticRoleHolders.teamManagers);
    } catch (err) {
      console.error('Failed to load automatic role holders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load automatic role holders');
    } finally {
      setAutomaticRolesLoading(false);
    }
  }, [userService, accountId]);

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
          loadAutomaticRoleHolders();
          setInitialized(true);
        })
        .catch((err) => {
          console.error('Failed to fetch current season:', err);
          // Still load users and roles even if season fetch fails
          loadUsersWithSeason(null);
          loadRoles();
          loadAutomaticRoleHolders();
          setInitialized(true);
        });
    }
  }, [
    token,
    accountId,
    initialized,
    loadRoles,
    fetchCurrentSeason,
    loadUsersWithSeason,
    loadAutomaticRoleHolders,
  ]);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!userService || !accountId) return;

    try {
      setSearchLoading(true);
      setError(null);

      if (!searchTerm.trim()) {
        // If search is empty, clear search results and load all users
        setIsShowingSearchResults(false);
        await loadUsers(0);
      } else {
        // Use the search endpoint with pagination
        const searchResponse = await userService.searchUsers(
          accountId,
          searchTerm,
          currentSeasonId,
          onlyWithRoles,
          {
            page: 0, // Frontend uses 0-based pagination
            limit: rowsPerPageRef.current,
            sortBy: 'lastname',
            sortOrder: 'asc',
          },
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

      // Clear search term and search results state
      setSearchTerm('');
      setIsShowingSearchResults(false);

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
        dataManager.setLoading();
        setError(null);

        // Update filter state
        setOnlyWithRoles(filterValue);

        // If we have a search term, re-run the search with the new filter
        if (searchTerm.trim()) {
          const searchResults = await apiOperations.searchUsersWithFilter({
            searchTerm,
            seasonId: currentSeasonId,
            onlyWithRoles: filterValue,
          });
          dataManager.setData(
            searchResults.users,
            searchResults.pagination.hasNext ?? false,
            searchResults.pagination.hasPrev ?? false,
            1,
          );
        } else {
          // Use the new API operations layer
          const response = await apiOperations.fetchUsersWithFilter({
            page: 1,
            limit: rowsPerPageRef.current,
            sortBy: 'lastname',
            sortOrder: 'asc',
            seasonId: currentSeasonId,
            onlyWithRoles: filterValue,
          });
          dataManager.setData(
            response.users,
            response.pagination.hasNext ?? false,
            response.pagination.hasPrev ?? false,
            1,
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to apply filter');
        dataManager.clearData();
      }
    },
    [
      dataManager,
      apiOperations,
      searchTerm,
      currentSeasonId,
      setOnlyWithRoles,
      accountId,
      userService,
    ],
  );

  // Pagination handlers - atomic state updates
  const handleNextPage = useCallback(async () => {
    if (hasNext && !loading) {
      const nextPage = page + 1;

      // If showing search results, maintain search context
      if (isShowingSearchResults && searchTerm.trim() && userService) {
        try {
          dispatch({ type: 'START_PAGINATION', page: nextPage });
          setError(null);

          const searchResponse = await userService.searchUsers(
            accountId,
            searchTerm,
            currentSeasonId,
            onlyWithRoles,
            {
              page: nextPage - 1, // Backend uses 0-based pagination
              limit: rowsPerPageRef.current,
              sortBy: 'lastname',
              sortOrder: 'asc',
            },
          );

          dispatch({
            type: 'SET_DATA',
            users: searchResponse.users,
            hasNext: searchResponse.pagination.hasNext ?? false,
            hasPrev: searchResponse.pagination.hasPrev ?? false,
            page: nextPage,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load next page');
          dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
        }
      } else {
        // Regular pagination for all users
        loadUsers(nextPage, undefined, true);
      }
    }
  }, [
    hasNext,
    page,
    loadUsers,
    loading,
    isShowingSearchResults,
    searchTerm,
    userService,
    accountId,
    currentSeasonId,
    onlyWithRoles,
  ]);

  const handlePrevPage = useCallback(async () => {
    if (hasPrev && !loading) {
      const prevPage = page - 1;

      // If showing search results, maintain search context
      if (isShowingSearchResults && searchTerm.trim() && userService) {
        try {
          dispatch({ type: 'START_PAGINATION', page: prevPage });
          setError(null);

          const searchResponse = await userService.searchUsers(
            accountId,
            searchTerm,
            currentSeasonId,
            onlyWithRoles,
            {
              page: prevPage - 1, // Backend uses 0-based pagination
              limit: rowsPerPageRef.current,
              sortBy: 'lastname',
              sortOrder: 'asc',
            },
          );

          dispatch({
            type: 'SET_DATA',
            users: searchResponse.users,
            hasNext: searchResponse.pagination.hasNext ?? false,
            hasPrev: searchResponse.pagination.hasPrev ?? false,
            page: prevPage,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load previous page');
          dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
        }
      } else {
        // Regular pagination for all users
        loadUsers(prevPage, undefined, true);
      }
    }
  }, [
    hasPrev,
    page,
    loadUsers,
    loading,
    isShowingSearchResults,
    searchTerm,
    userService,
    accountId,
    currentSeasonId,
    onlyWithRoles,
  ]);

  const handleRowsPerPageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);

      // If showing search results, maintain search context
      if (isShowingSearchResults && searchTerm.trim() && userService) {
        try {
          dispatch({ type: 'START_PAGINATION', page: 1 });
          setError(null);

          const searchResponse = await userService.searchUsers(
            accountId,
            searchTerm,
            currentSeasonId,
            onlyWithRoles,
            {
              page: 0, // Backend uses 0-based pagination
              limit: newRowsPerPage,
              sortBy: 'lastname',
              sortOrder: 'asc',
            },
          );

          dispatch({
            type: 'SET_DATA',
            users: searchResponse.users,
            hasNext: searchResponse.pagination.hasNext ?? false,
            hasPrev: searchResponse.pagination.hasPrev ?? false,
            page: 1,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update rows per page');
          dispatch({ type: 'SET_DATA', users: [], hasNext: false, hasPrev: false });
        }
      } else {
        // Regular pagination for all users
        loadUsers(1, newRowsPerPage, true);
      }
    },
    [
      loadUsers,
      isShowingSearchResults,
      searchTerm,
      userService,
      accountId,
      currentSeasonId,
      onlyWithRoles,
    ],
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
    async (user: ContactType) => {
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

  const openRemoveRoleDialog = useCallback((user: ContactType, role: ContactRoleType) => {
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

  const openCreateContactDialog = useCallback(() => {
    setCreateContactDialogOpen(true);
  }, []);

  const closeCreateContactDialog = useCallback(() => {
    setCreateContactDialogOpen(false);
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
    async (contactData: CreateContactType | null, photoFile?: File | null) => {
      if (!userService || !selectedContactForEdit || !accountId) {
        throw new Error('Unable to update contact - missing required data');
      }

      setFormLoading(true);

      if (!contactData) {
        throw new Error('TODO: should do photoFile upload only here');
      }

      // todo: duplicated method in userRosterDataManager - refactor to common utility.
      // but maybe both these files will go away once we move to new architecture?
      const result = photoFile
        ? await apiUpdateContact({
            path: { accountId, contactId: selectedContactForEdit.id },
            client: apiClient,
            throwOnError: false,
            bodySerializer: (body) => {
              const formData = new FormData();
              Object.entries(body).forEach(([key, value]) => {
                if (value instanceof File) {
                  formData.append(key, value);
                } else if (value !== undefined && value !== null) {
                  formData.append(key, String(value));
                }
              });
              return formData;
            },
          })
        : await apiUpdateContact({
            path: { accountId, contactId: selectedContactForEdit.id },
            client: apiClient,
            throwOnError: false,
            body: { ...contactData, photo: undefined },
          });

      if (result.data) {
        const updatedContact = result.data;
        // Update the specific user in state with new data including cache-busted photo URL
        const updatedUsers = paginationState.users.map((user) => {
          if (user.id === selectedContactForEdit.id) {
            // Apply cache busting to photo URL if present
            const updatedPhotoUrl = updatedContact.photoUrl
              ? addCacheBuster(updatedContact.photoUrl, Date.now())
              : undefined;

            return {
              ...user,
              firstName: updatedContact.firstName || user.firstName,
              lastName: updatedContact.lastName || user.lastName,
              middleName: updatedContact.middleName || user.middleName, // ✅ Use top-level middleName
              email: updatedContact.email || user.email,
              photoUrl: updatedPhotoUrl,
              contactDetails: {
                ...user.contactDetails,
                phone1: updatedContact.contactDetails?.phone1 || null,
                phone2: updatedContact.contactDetails?.phone2 || null,
                phone3: updatedContact.contactDetails?.phone3 || null,
                streetaddress: updatedContact.contactDetails?.streetaddress || null,
                city: updatedContact.contactDetails?.city || null,
                state: updatedContact.contactDetails?.state || null,
                zip: updatedContact.contactDetails?.zip || null,
                dateofbirth: updatedContact.contactDetails?.dateofbirth || null,
                // ❌ Removed: middlename (moved to top-level middleName)
              },
            };
          }
          return user;
        });

        dispatch({
          type: 'SET_DATA',
          users: [...updatedUsers], // Force new array reference to trigger re-render
          hasNext: paginationState.hasNext,
          hasPrev: paginationState.hasPrev,
          page: paginationState.page,
        });

        setSuccess('Contact updated successfully');
        closeEditContactDialog();
      } else {
        console.error('Error updating contact:', result.error?.message);
      }
      setFormLoading(false);
    },
    [
      userService,
      selectedContactForEdit,
      accountId,
      paginationState.page,
      paginationState.hasNext,
      paginationState.hasPrev,
      paginationState.users,
      closeEditContactDialog,
    ],
  );

  // todo: should combine this with handleEditContact
  const handleCreateContact = useCallback(
    async (contactData: CreateContactType | null, photoFile?: File | null) => {
      if (!userService || !accountId) {
        throw new Error('Unable to create contact - missing required data');
      }

      setFormLoading(true);

      if (!contactData) {
        throw new Error('TODO: should do photoFile upload only here');
      }

      try {
        await userService.createContact(accountId, contactData, photoFile);

        // Reload the user list to show the new contact
        await loadUsers(1);

        setSuccess('Contact created successfully');
        closeCreateContactDialog();
      } catch (error) {
        console.error('Error creating contact:', error);
        throw error; // Propagate error to dialog
      } finally {
        setFormLoading(false);
      }
    },
    [userService, accountId, loadUsers, closeCreateContactDialog],
  );

  const handleDeleteContactPhoto = useCallback(
    async (contactId: string) => {
      if (!userService || !accountId) {
        setError('Unable to delete contact photo - missing required data');
        return;
      }

      try {
        await userService.deleteContactPhoto(accountId, contactId);
        setSuccess('Contact photo deleted successfully');

        // Update the specific user to remove the photo URL
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
          users: [...updatedUsers], // Force new array reference to trigger re-render
          hasNext: paginationState.hasNext,
          hasPrev: paginationState.hasPrev,
          page: paginationState.page,
        });
      } catch (error) {
        console.error('Error deleting contact photo:', error);
        setError(extractErrorMessage(error));
      }
    },
    [
      userService,
      accountId,
      paginationState.page,
      paginationState.hasNext,
      paginationState.hasPrev,
      paginationState.users,
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
              hasNext: previousPageResponse.pagination.hasNext ?? false,
              hasPrev: previousPageResponse.pagination.hasPrev ?? false,
              page: currentPage - 1,
            });
          } else {
            dispatch({
              type: 'SET_DATA',
              users: usersResponse.users,
              hasNext: usersResponse.pagination.hasNext ?? false,
              hasPrev: usersResponse.pagination.hasPrev ?? false,
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
      handleSearch,
    ],
  );

  const handleRevokeRegistration = useCallback(
    async (contactId: string) => {
      if (!userService || !accountId) {
        setError('Unable to revoke registration - missing required data');
        return;
      }

      try {
        await userService.revokeRegistration(accountId, contactId);
        setSuccess('Registration removed successfully');

        // Update users in-place to clear userId
        const updatedUsers = paginationState.users.map((u) =>
          u.id === contactId ? { ...u, userId: '' } : u,
        );

        dispatch({
          type: 'SET_DATA',
          users: [...updatedUsers],
          hasNext: paginationState.hasNext,
          hasPrev: paginationState.hasPrev,
          page: paginationState.page,
        });
      } catch (error) {
        console.error('Error revoking registration:', error);
        setError(extractErrorMessage(error));
      }
    },
    [
      userService,
      accountId,
      paginationState.users,
      paginationState.hasNext,
      paginationState.hasPrev,
      paginationState.page,
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
    isShowingSearchResults,
    onlyWithRoles,
    isPaginating, // Use the state from reducer

    // Dialog states
    assignRoleDialogOpen,
    removeRoleDialogOpen,
    editContactDialogOpen,
    deleteContactDialogOpen,
    createContactDialogOpen,
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
    handleAssignRole,
    handleRemoveRole,
    openAssignRoleDialog,
    closeAssignRoleDialog,
    openRemoveRoleDialog,
    openEditContactDialog,
    closeEditContactDialog,
    handleEditContact,
    openCreateContactDialog,
    closeCreateContactDialog,
    handleCreateContact,
    handleDeleteContactPhoto,
    openDeleteContactDialog,
    closeDeleteContactDialog,
    handleDeleteContact,
    handleRevokeRegistration,
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
