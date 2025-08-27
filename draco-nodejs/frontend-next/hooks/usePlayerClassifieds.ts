// usePlayerClassifieds Hook
// Main hook for managing Player Classifieds data and operations

import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import { playerClassifiedService } from '../services/playerClassifiedService';
import {
  IUsePlayerClassifiedsReturn,
  IClassifiedsUIState,
  IPlayersWantedFormState,
  ITeamsWantedFormState,
  IPlayersWantedResponse,
  ITeamsWantedResponse,
  IPlayersWantedCreateRequest,
  IPlayersWantedUpdateRequest,
  ITeamsWantedCreateRequest,
  ITeamsWantedUpdateRequest,
  IClassifiedSearchResult,
  IClassifiedSearchParams,
} from '../types/playerClassifieds';

export const usePlayerClassifieds = (
  accountId: string,
  token?: string,
): IUsePlayerClassifiedsReturn => {
  // Data
  const [playersWanted, setPlayersWanted] = useState<IPlayersWantedResponse[]>([]);
  const [teamsWanted, setTeamsWanted] = useState<ITeamsWantedResponse[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [paginationInfo, setPaginationInfo] = useState<{
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // UI State
  const [uiState] = useState<IClassifiedsUIState>({
    loading: false,
    error: null,
    success: null,
    searchTerm: '',
    selectedPositions: [],
    selectedExperience: '',
    sortBy: 'dateCreated',
    viewMode: 'grid',
  });

  // Notifications
  const { showNotification } = useNotifications();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [playersResponse, teamsResponse] = await Promise.all([
        playerClassifiedService.getPlayersWanted(accountId),
        token
          ? playerClassifiedService.getTeamsWanted(accountId, undefined, token)
          : Promise.resolve({ success: true, data: { data: [] } }),
      ]);

      // Handle Players Wanted response
      if (playersResponse.success && playersResponse.data) {
        setPlayersWanted(playersResponse.data.data);
      } else {
        console.warn('Failed to load Players Wanted:', playersResponse.error);
        setPlayersWanted([]);
      }

      // Handle Teams Wanted response
      if (teamsResponse.success && teamsResponse.data) {
        setTeamsWanted(teamsResponse.data.data);
      } else {
        console.warn(
          'Failed to load Teams Wanted:',
          'error' in teamsResponse ? teamsResponse.error : 'Unknown error',
        );
        setTeamsWanted([]);
      }
    } catch (error) {
      console.error('Unexpected error in loadData:', error);
      const errorMessage = 'Failed to load classifieds';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [accountId, token, showNotification]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================================
  // PLAYERS WANTED OPERATIONS
  // ============================================================================

  // Create Players Wanted
  const createPlayersWanted = useCallback(
    async (data: IPlayersWantedFormState): Promise<void> => {
      if (!token) {
        throw new Error('Authentication required to create Players Wanted');
      }

      setFormLoading(true);
      try {
        const createData: IPlayersWantedCreateRequest = {
          teamEventName: data.teamEventName,
          description: data.description,
          positionsNeeded: data.positionsNeeded.join(', '),
        };

        const newClassified = await playerClassifiedService.createPlayersWanted(
          accountId,
          createData,
          token,
        );
        setPlayersWanted((prev) => [newClassified, ...prev]);
        showNotification('Players Wanted created successfully', 'success');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create Players Wanted';
        showNotification(errorMessage, 'error');
        throw error;
      } finally {
        setFormLoading(false);
      }
    },
    [accountId, token, showNotification],
  );

  // Update Players Wanted
  const updatePlayersWanted = useCallback(
    async (id: string, data: Partial<IPlayersWantedFormState>): Promise<void> => {
      if (!token) {
        throw new Error('Authentication required to update Players Wanted');
      }

      setFormLoading(true);
      try {
        const updateData: IPlayersWantedUpdateRequest = {};
        if (data.teamEventName !== undefined) updateData.teamEventName = data.teamEventName;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.positionsNeeded !== undefined)
          updateData.positionsNeeded = data.positionsNeeded.join(', ');

        const updatedClassified = await playerClassifiedService.updatePlayersWanted(
          accountId,
          id,
          updateData,
          token,
        );
        setPlayersWanted((prev) =>
          prev.map((item) => (item.id.toString() === id ? updatedClassified : item)),
        );
        showNotification('Players Wanted updated successfully', 'success');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update Players Wanted';
        showNotification(errorMessage, 'error');
        throw error;
      } finally {
        setFormLoading(false);
      }
    },
    [accountId, token, showNotification],
  );

  // Delete Players Wanted
  const deletePlayersWanted = useCallback(
    async (id: string): Promise<void> => {
      if (!token) {
        throw new Error('Authentication required to delete Players Wanted');
      }

      try {
        await playerClassifiedService.deletePlayersWanted(accountId, id, token);
        setPlayersWanted((prev) => prev.filter((item) => item.id.toString() !== id));
        showNotification('Players Wanted deleted successfully', 'success');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete Players Wanted';
        showNotification(errorMessage, 'error');
        throw error;
      }
    },
    [accountId, token, showNotification],
  );

  // ============================================================================
  // TEAMS WANTED OPERATIONS
  // ============================================================================

  // Create Teams Wanted
  const createTeamsWanted = useCallback(
    async (data: ITeamsWantedFormState): Promise<void> => {
      setFormLoading(true);
      try {
        if (!data.birthDate) {
          throw new Error('Birth date is required');
        }

        const createData: ITeamsWantedCreateRequest = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          experience: data.experience,
          positionsPlayed: data.positionsPlayed.join(', '),
          birthDate: data.birthDate,
        };

        const newClassified = await playerClassifiedService.createTeamsWanted(
          accountId,
          createData,
        );
        setTeamsWanted((prev) => [newClassified, ...prev]);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create Teams Wanted';
        showNotification(errorMessage, 'error');
        throw error;
      } finally {
        setFormLoading(false);
      }
    },
    [accountId, showNotification],
  );

  // Update Teams Wanted
  const updateTeamsWanted = useCallback(
    async (
      id: string,
      data: Partial<ITeamsWantedFormState>,
      accessCode: string,
    ): Promise<ITeamsWantedResponse> => {
      setFormLoading(true);

      try {
        const updateData: ITeamsWantedUpdateRequest = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.experience !== undefined) updateData.experience = data.experience;
        if (data.positionsPlayed !== undefined)
          updateData.positionsPlayed = data.positionsPlayed.join(', ');
        if (data.birthDate !== undefined) updateData.birthDate = data.birthDate || undefined;

        // Only add accessCode for non-authenticated users
        if (!token) {
          updateData.accessCode = accessCode;
        }

        // If we have a token (authenticated user), use token; otherwise use access code
        const updatedClassified = await playerClassifiedService.updateTeamsWanted(
          accountId,
          id,
          updateData,
          token || undefined,
        );
        setTeamsWanted((prev) =>
          prev.map((item) =>
            item && item.id && item.id.toString() === id ? updatedClassified : item,
          ),
        );
        return updatedClassified;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update Teams Wanted';
        showNotification(errorMessage, 'error');
        throw error;
      } finally {
        setFormLoading(false);
      }
    },
    [accountId, token, showNotification],
  );

  // Delete Teams Wanted
  const deleteTeamsWanted = useCallback(
    async (id: string, accessCode: string): Promise<{ success: boolean; error?: string }> => {
      try {
        // If we have a token (authenticated user), use token; otherwise use access code
        if (token) {
          await playerClassifiedService.deleteTeamsWanted(accountId, id, token);
        } else {
          await playerClassifiedService.deleteTeamsWanted(accountId, id, undefined, accessCode);
        }
        setTeamsWanted((prev) => prev.filter((item) => item.id.toString() !== id));
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete Teams Wanted';
        return { success: false, error: errorMessage };
      }
    },
    [accountId, token],
  );

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  // Search classifieds
  const searchClassifieds = useCallback(
    async (params: IClassifiedSearchParams): Promise<void> => {
      if (!token) {
        throw new Error('Authentication required to search classifieds');
      }

      setLoading(true);
      try {
        const searchResults = await playerClassifiedService.searchClassifieds(
          accountId,
          params,
          token,
        );

        // Update both lists based on search results
        const playersResults: IPlayersWantedResponse[] = [];
        const teamsResults: ITeamsWantedResponse[] = [];

        // Handle search results - they should be an array of IClassifiedSearchResult
        if (Array.isArray(searchResults)) {
          searchResults.forEach((result: IClassifiedSearchResult) => {
            if ('teamEventName' in result.classified) {
              playersResults.push(result.classified as IPlayersWantedResponse);
            } else {
              teamsResults.push(result.classified as ITeamsWantedResponse);
            }
          });
        }

        setPlayersWanted(playersResults);
        setTeamsWanted(teamsResults);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to search classifieds';
        showNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [accountId, token, showNotification],
  );

  // Clear search and reload original data
  const clearSearch = useCallback(async (): Promise<void> => {
    await loadData();
  }, [loadData]);

  // ============================================================================
  // DATA REFRESH
  // ============================================================================

  // Refresh all data
  const refreshData = useCallback(async (): Promise<void> => {
    await loadData();
  }, [loadData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // PAGINATION AND LOADING
  // ============================================================================

  // Load paginated Teams Wanted data
  const loadTeamsWantedPage = useCallback(
    async (page: number, limit: number) => {
      setError(null);
      setPaginationLoading(true);

      try {
        if (!token) {
          return;
        }
        const response = await playerClassifiedService.getTeamsWanted(
          accountId,
          {
            page,
            limit,
            sortBy: 'dateCreated',
            sortOrder: 'desc',
            type: 'teams',
          },
          token,
        );

        if (response.success && response.data) {
          setTeamsWanted(response.data.data);
          setPaginationInfo({
            total: response.data.total || 0,
            totalPages: response.data.pagination?.totalPages || 0,
            hasNext: response.data.pagination?.hasNext || false,
            hasPrev: response.data.pagination?.hasPrev || false,
          });
          setError(null);
        } else {
          // Handle error response
          let errorMessage = response.error || 'Failed to load Teams Wanted ads';
          if (response.errorCode === 'Unauthorized') {
            errorMessage =
              'You are not authorized to view Teams Wanted ads for this account. Please sign in or join the account.';
          } else if (response.errorCode === 'Forbidden') {
            errorMessage =
              'Access denied. You do not have permission to view Teams Wanted ads for this account.';
          } else if (response.statusCode === 404) {
            errorMessage = 'Account not found or Teams Wanted feature is not available.';
          }
          setError(errorMessage);
          // Don't clear existing data on error - keep showing what we have
        }
      } catch (error) {
        console.error('Unexpected error in loadTeamsWantedPage:', error);
        setError('An unexpected error occurred while loading Teams Wanted ads');
        // Don't clear existing data on error - keep showing what we have
      } finally {
        setPaginationLoading(false);
      }
    },
    [accountId, token],
  );

  // Clear Teams Wanted state (for preventing duplicate keys)
  const clearTeamsWantedState = useCallback(() => {
    setTeamsWanted([]);
    setError(null);
  }, []);

  return {
    // Data
    playersWanted,
    teamsWanted,

    // Loading states
    loading,
    paginationLoading,
    formLoading,

    // Error state
    error,

    // UI state
    uiState,

    // Pagination info
    paginationInfo,

    // Actions
    createPlayersWanted,
    updatePlayersWanted,
    deletePlayersWanted,
    createTeamsWanted,
    updateTeamsWanted,
    deleteTeamsWanted,

    // Pagination methods
    loadTeamsWantedPage,
    clearTeamsWantedState,

    // Search and filtering
    searchClassifieds,
    clearSearch,

    // Refresh data
    refreshData,

    // Error handling
    clearError,
  };
};
