import { useState, useEffect } from 'react';
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
  teamsWantedPage?: number,
  teamsWantedLimit?: number,
): IUsePlayerClassifiedsReturn => {
  const [playersWanted, setPlayersWanted] = useState<PlayersWantedClassifiedType[]>([]);
  const [teamsWanted, setTeamsWanted] = useState<TeamsWantedPublicClassifiedType[]>([]);

  const [loading, setLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

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

  const { showNotification } = useNotifications();

  const [reloadKey, setReloadKey] = useState(0);
  const [teamsWantedReloadKey, setTeamsWantedReloadKey] = useState(0);

  const hasPagination = teamsWantedPage !== undefined && teamsWantedLimit !== undefined;

  useEffect(() => {
    const controller = new AbortController();

    const doLoad = async () => {
      setLoading(true);
      try {
        const [playersResponse, teamsResponse] = await Promise.all([
          playerClassifiedService.getPlayersWanted(accountId, undefined, controller.signal),
          !hasPagination && token
            ? playerClassifiedService.getTeamsWanted(accountId, undefined, token, controller.signal)
            : Promise.resolve(null),
        ]);

        if (controller.signal.aborted) return;

        setPlayersWanted(playersResponse.data);

        if (teamsResponse) {
          setTeamsWanted(teamsResponse.data);
        }
      } catch {
        if (controller.signal.aborted) return;
        const errorMessage = 'Failed to load classifieds';
        showNotification(errorMessage, 'error');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void doLoad();

    return () => {
      controller.abort();
    };
  }, [accountId, token, reloadKey, hasPagination, showNotification]);

  useEffect(() => {
    if (!token || !hasPagination) return;

    const controller = new AbortController();

    const loadPage = async () => {
      setError(null);
      setPaginationLoading(true);

      try {
        const response = await playerClassifiedService.getTeamsWanted(
          accountId,
          {
            page: teamsWantedPage,
            limit: teamsWantedLimit,
            sortBy: 'dateCreated',
            sortOrder: 'desc',
          },
          token,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setTeamsWanted(response.data);
        setPaginationInfo({
          total: response.total || 0,
          totalPages: response.pagination?.totalPages || 0,
          hasNext: response.pagination?.hasNext || false,
          hasPrev: response.pagination?.hasPrev || false,
        });
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Teams Wanted';
        showNotification(errorMessage, 'error');
      } finally {
        if (!controller.signal.aborted) {
          setPaginationLoading(false);
        }
      }
    };

    void loadPage();

    return () => {
      controller.abort();
    };
  }, [
    accountId,
    token,
    teamsWantedPage,
    teamsWantedLimit,
    hasPagination,
    teamsWantedReloadKey,
    showNotification,
  ]);

  const createPlayersWanted = async (data: UpsertPlayersWantedClassifiedType): Promise<void> => {
    if (!token) {
      throw new Error('Authentication required to create Players Wanted');
    }

    setFormLoading(true);
    try {
      const createData: UpsertPlayersWantedClassifiedType = {
        teamEventName: data.teamEventName,
        description: data.description,
        positionsNeeded: data.positionsNeeded,
        notifyOptOut: data.notifyOptOut ?? false,
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
  };

  const updatePlayersWanted = async (
    id: string,
    data: UpsertPlayersWantedClassifiedType,
  ): Promise<void> => {
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
  };

  const deletePlayersWanted = async (id: string): Promise<void> => {
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
  };

  const createTeamsWanted = async (data: UpsertTeamsWantedClassifiedType): Promise<void> => {
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
        notifyOptOut: data.notifyOptOut,
      };

      const newClassified = await playerClassifiedService.createTeamsWanted(accountId, createData);
      setTeamsWanted((prev) => [newClassified, ...prev]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create Teams Wanted';
      showNotification(errorMessage, 'error');
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const updateTeamsWanted = async (
    id: string,
    data: UpsertTeamsWantedClassifiedType,
    accessCode: string,
  ): Promise<TeamsWantedOwnerClassifiedType> => {
    setFormLoading(true);

    try {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Teams Wanted';
      showNotification(errorMessage, 'error');
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const deleteTeamsWanted = async (
    id: string,
    accessCode: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (token) {
        await playerClassifiedService.deleteTeamsWanted(accountId, id, token);
      } else {
        await playerClassifiedService.deleteTeamsWanted(accountId, id, undefined, accessCode);
      }
      setTeamsWanted((prev) => prev.filter((item) => item.id.toString() !== id));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete Teams Wanted';
      return { success: false, error: errorMessage };
    }
  };

  const refreshData = (): void => {
    setReloadKey((k) => k + 1);
  };

  const clearError = () => {
    setError(null);
  };

  const reloadTeamsWantedPage = () => {
    setTeamsWantedReloadKey((k) => k + 1);
  };

  const clearTeamsWantedState = () => {
    setTeamsWanted([]);
    setError(null);
  };

  return {
    playersWanted,
    teamsWanted,

    loading,
    paginationLoading,
    formLoading,

    error,

    uiState,

    paginationInfo,

    createPlayersWanted,
    updatePlayersWanted,
    deletePlayersWanted,
    createTeamsWanted,
    updateTeamsWanted,
    deleteTeamsWanted,

    reloadTeamsWantedPage,
    clearTeamsWantedState,

    refreshData,

    clearError,
  };
};
