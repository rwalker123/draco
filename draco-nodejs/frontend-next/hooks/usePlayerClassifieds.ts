// usePlayerClassifieds Hook
// Main hook for managing Player Classifieds data and operations

import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import { playerClassifiedService } from '../services/playerClassifiedService';
import { IUsePlayerClassifiedsReturn, IClassifiedsUIState } from '../types/playerClassifieds';
import {
  UpsertPlayersWantedClassifiedType,
  UpsertTeamsWantedClassifiedType,
  PlayersWantedClassifiedType,
  TeamsWantedOwnerClassifiedType,
  TeamsWantedPublicClassifiedType,
} from '@draco/shared-schemas';

export const usePlayerClassifieds = (
  accountId: string,
  token?: string,
): IUsePlayerClassifiedsReturn => {
  // Data
  const [playersWanted, setPlayersWanted] = useState<PlayersWantedClassifiedType[]>([]);
  const [teamsWanted, setTeamsWanted] = useState<TeamsWantedPublicClassifiedType[]>([]);

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
          : Promise.resolve(null),
      ]);

      // Handle Players Wanted response
      setPlayersWanted(playersResponse.data);

      // Handle Teams Wanted response
      if (teamsResponse) {
        setTeamsWanted(teamsResponse.data);
      }
    } catch (error) {
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
    async (data: UpsertPlayersWantedClassifiedType): Promise<void> => {
      if (!token) {
        throw new Error('Authentication required to create Players Wanted');
      }

      setFormLoading(true);
      try {
        const createData: UpsertPlayersWantedClassifiedType = {
          teamEventName: data.teamEventName,
          description: data.description,
          positionsNeeded: data.positionsNeeded,
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
    async (id: string, data: UpsertPlayersWantedClassifiedType): Promise<void> => {
      if (!token) {
        throw new Error('Authentication required to update Players Wanted');
      }

      setFormLoading(true);
      try {
        const updatedClassified = await playerClassifiedService.updatePlayersWanted(
          accountId,
          id,
          data,
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
    async (data: UpsertTeamsWantedClassifiedType): Promise<void> => {
      setFormLoading(true);
      try {
        if (!data.birthDate) {
          throw new Error('Birth date is required');
        }

        const createData: UpsertTeamsWantedClassifiedType = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          experience: data.experience,
          positionsPlayed: data.positionsPlayed,
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
      data: UpsertTeamsWantedClassifiedType,
      accessCode: string,
    ): Promise<TeamsWantedOwnerClassifiedType> => {
      setFormLoading(true);

      try {
        // If we have a token (authenticated user), use token; otherwise use access code
        const updatedClassified = await playerClassifiedService.updateTeamsWanted(
          accountId,
          id,
          data,
          token || undefined,
          accessCode,
        );
        setTeamsWanted((prev) =>
          prev.map((item: TeamsWantedPublicClassifiedType) =>
            item && item.id && item.id.toString() === id
              ? (updatedClassified as TeamsWantedPublicClassifiedType)
              : item,
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
          },
          token,
        );

        setTeamsWanted(response.data);
        setPaginationInfo({
          total: response.total || 0,
          totalPages: response.pagination?.totalPages || 0,
          hasNext: response.pagination?.hasNext || false,
          hasPrev: response.pagination?.hasPrev || false,
        });
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load Teams Wanted';
        showNotification(errorMessage, 'error');
      } finally {
        setPaginationLoading(false);
      }
    },
    [accountId, token, showNotification],
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

    // Refresh data
    refreshData,

    // Error handling
    clearError,
  };
};
