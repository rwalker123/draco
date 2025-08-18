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

export const usePlayerClassifieds = (accountId: string): IUsePlayerClassifiedsReturn => {
  // Data
  const [playersWanted, setPlayersWanted] = useState<IPlayersWantedResponse[]>([]);
  const [teamsWanted, setTeamsWanted] = useState<ITeamsWantedResponse[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

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
        playerClassifiedService.getTeamsWanted(accountId),
      ]);

      setPlayersWanted(playersResponse.data);
      setTeamsWanted(teamsResponse.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load classifieds';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [accountId, showNotification]);

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
    [accountId, showNotification],
  );

  // Update Players Wanted
  const updatePlayersWanted = useCallback(
    async (id: string, data: Partial<IPlayersWantedFormState>): Promise<void> => {
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
    [accountId, showNotification],
  );

  // Delete Players Wanted
  const deletePlayersWanted = useCallback(
    async (id: string): Promise<void> => {
      try {
        await playerClassifiedService.deletePlayersWanted(accountId, id);
        setPlayersWanted((prev) => prev.filter((item) => item.id.toString() !== id));
        showNotification('Players Wanted deleted successfully', 'success');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete Players Wanted';
        showNotification(errorMessage, 'error');
        throw error;
      }
    },
    [accountId, showNotification],
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
        showNotification('Teams Wanted created successfully', 'success');
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
    async (id: string, data: Partial<ITeamsWantedFormState>, accessCode: string): Promise<void> => {
      setFormLoading(true);
      try {
        const updateData: ITeamsWantedUpdateRequest = {
          accessCode,
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.experience !== undefined) updateData.experience = data.experience;
        if (data.positionsPlayed !== undefined)
          updateData.positionsPlayed = data.positionsPlayed.join(', ');
        if (data.birthDate !== undefined) updateData.birthDate = data.birthDate || undefined;

        const updatedClassified = await playerClassifiedService.updateTeamsWanted(
          accountId,
          id,
          updateData,
        );
        setTeamsWanted((prev) =>
          prev.map((item) => (item.id.toString() === id ? updatedClassified : item)),
        );
        showNotification('Teams Wanted updated successfully', 'success');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update Teams Wanted';
        showNotification(errorMessage, 'error');
        throw error;
      } finally {
        setFormLoading(false);
      }
    },
    [accountId, showNotification],
  );

  // Delete Teams Wanted
  const deleteTeamsWanted = useCallback(
    async (id: string, _accessCode: string): Promise<void> => {
      try {
        await playerClassifiedService.deleteTeamsWanted(accountId, id);
        setTeamsWanted((prev) => prev.filter((item) => item.id.toString() !== id));
        showNotification('Teams Wanted deleted successfully', 'success');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete Teams Wanted';
        showNotification(errorMessage, 'error');
        throw error;
      }
    },
    [accountId, showNotification],
  );

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  // Search classifieds
  const searchClassifieds = useCallback(
    async (params: IClassifiedSearchParams): Promise<void> => {
      setLoading(true);
      try {
        const searchResults = await playerClassifiedService.searchClassifieds(accountId, params);

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
    [accountId, showNotification],
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

  return {
    // Data
    playersWanted,
    teamsWanted,

    // Loading states
    loading,
    formLoading,

    // Error state
    error,

    // UI state
    uiState,

    // Actions
    createPlayersWanted,
    updatePlayersWanted,
    deletePlayersWanted,
    createTeamsWanted,
    updateTeamsWanted,
    deleteTeamsWanted,

    // Search and filtering
    searchClassifieds,
    clearSearch,

    // Refresh data
    refreshData,

    // Error handling
    clearError,
  };
};
