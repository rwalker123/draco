import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { ContactTransformationService } from '../services/contactTransformationService';
import { BaseContactType, RosterMemberType, RosterPlayerType } from '@draco/shared-schemas';
import {
  updateRosterMember as apiUpdateRosterMember,
  signPlayer as apiSignPlayer,
  releasePlayer as apiReleasePlayer,
  activatePlayer as apiActivatePlayer,
  deletePlayer as apiDeletePlayer,
  addManager as apiAddManager,
  removeManager as apiRemoveManager,
  deleteContactPhoto as apiDeleteContactPhoto,
  getContactRoster as apiGetContactRoster,
  getAccountSeason,
} from '@draco/shared-api-client';
import {
  TeamManagerType,
  TeamRosterMembersType,
  SignRosterMemberType,
} from '@draco/shared-schemas';
import axios from 'axios';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

interface Season {
  id: string;
  name: string;
}

interface League {
  id: string;
  name: string;
}

interface UseRosterDataManagerOptions {
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

interface RosterMemberUpdates {
  playerNumber?: number;
  inactive?: boolean;
  submittedWaiver?: boolean;
}

// todo: check to see if we should really be storing the available players in the state
// it could be better to just fetch the available players when needed
interface RosterDataManagerState {
  rosterData: TeamRosterMembersType;
  managers: TeamManagerType[];
  season: Season | null;
  league: League | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

interface RosterDataManagerActions {
  // Data fetching
  fetchRosterData: () => Promise<void>;
  fetchAvailablePlayers: (firstName?: string, lastName?: string) => Promise<BaseContactType[]>;
  fetchManagers: () => Promise<void>;
  fetchSeasonData: () => Promise<void>;
  fetchLeagueData: () => Promise<void>;

  // Operations with optimistic updates
  updateRosterMember: (rosterMemberId: string, updates: RosterMemberUpdates) => Promise<void>;
  getContactRoster: (contactId: string) => Promise<RosterPlayerType | undefined>;
  signPlayer: (contactId: string, rosterData: SignRosterMemberType) => Promise<void>;
  releasePlayer: (rosterMemberId: string) => Promise<void>;
  activatePlayer: (rosterMemberId: string) => Promise<void>;
  deletePlayer: (rosterMemberId: string) => Promise<void>;
  addManager: (contactId: string) => Promise<void>;
  removeManager: (managerId: string) => Promise<void>;
  deleteContactPhoto: (contactId: string) => Promise<void>;

  // State management
  clearError: () => void;
  clearSuccessMessage: () => void;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
  setRosterData: (data: TeamRosterMembersType) => void;
}

export const useRosterDataManager = (
  options: UseRosterDataManagerOptions,
): RosterDataManagerState & RosterDataManagerActions => {
  const { accountId, seasonId, teamSeasonId } = options;
  const { token } = useAuth();
  const apiClient = useApiClient();

  // State
  const [rosterData, setRosterData] = useState<TeamRosterMembersType>({
    teamSeason: { id: teamSeasonId, name: '' },
    rosterMembers: [],
  });
  const [managers, setManagers] = useState<TeamManagerType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [season, setSeason] = useState<Season | null>(null);
  const [league, setLeague] = useState<League | null>(null);

  // Refs for service and data caching
  const dataCacheRef = useRef<{
    rosterData: TeamRosterMembersType | null;
    managers: TeamManagerType[];
  }>({
    rosterData: null,
    managers: [],
  });

  // Helper function to handle errors
  const getErrorMessage = useCallback((error: unknown, defaultMessage: string): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || defaultMessage;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return defaultMessage;
  }, []);

  // Helper function to transform backend data
  const transformBackendData = useCallback((data: unknown) => {
    if (!data) return data;

    // Handle TeamRosterData with roster members
    if (typeof data === 'object' && data !== null && 'rosterMembers' in data) {
      const teamData = data as { rosterMembers: unknown[] };
      return {
        ...teamData,
        rosterMembers: teamData.rosterMembers.map((member) => {
          const memberObj = member as Record<string, unknown>;
          const playerObj = memberObj.player as Record<string, unknown>;
          return {
            ...memberObj,
            player: {
              ...playerObj,
              // Transform contact if it has backend field names (lowercase)
              contact: playerObj?.contact
                ? ContactTransformationService.transformBackendContact(
                    playerObj.contact as Record<string, unknown>,
                  )
                : playerObj?.contact,
            },
          };
        }),
      };
    }

    // Handle array of contacts (available players)
    if (Array.isArray(data)) {
      return data.map((item) => {
        const itemObj = item as Record<string, unknown>;
        // If it's a ContactEntry with backend field names, transform it
        if (itemObj.firstname || itemObj.lastname) {
          return ContactTransformationService.transformBackendContact(itemObj);
        }
        // If it already has frontend field names, return as is
        if (itemObj.firstName || itemObj.lastName) {
          return item;
        }
        // Handle nested contact objects
        return {
          ...itemObj,
          contact: itemObj.contact
            ? ContactTransformationService.transformBackendContact(
                itemObj.contact as Record<string, unknown>,
              )
            : itemObj.contact,
          contacts: itemObj.contacts
            ? ContactTransformationService.transformBackendContact(
                itemObj.contacts as Record<string, unknown>,
              )
            : itemObj.contacts,
        };
      });
    }

    return data;
  }, []);

  // Fetch roster data
  const fetchRosterData = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data) {
        // const transformedData = transformBackendData(response.data) as TeamRosterMembersType;
        dataCacheRef.current.rosterData = response.data;
        setRosterData(response.data);
        setLoading(false);
      } else {
        setError(response.data.message || 'Failed to fetch roster data');
        setLoading(false);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch roster data');
      setError(errorMessage);
      setLoading(false);
    }
  }, [accountId, seasonId, teamSeasonId, token, setLoading, setError, getErrorMessage]);

  // Fetch available players - returns data directly instead of storing in state
  const fetchAvailablePlayers = useCallback(
    async (firstName?: string, lastName?: string): Promise<BaseContactType[]> => {
      if (!accountId || !seasonId || !teamSeasonId || !token) return [];

      try {
        // Build query string for name filtering
        const queryParams = new URLSearchParams();
        if (firstName?.trim()) queryParams.append('firstName', firstName.trim());
        if (lastName?.trim()) queryParams.append('lastName', lastName.trim());
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

        const response = await axios.get(
          `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/available-players${queryString}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data) {
          return response.data || [];
        }
        return [];
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, 'Failed to fetch available players');
        console.error(errorMessage, error);
        return [];
      }
    },
    [accountId, seasonId, teamSeasonId, token, getErrorMessage],
  );

  // Fetch managers
  const fetchManagers = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/managers`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const managers = response.data.data || [];
        const transformedManagers = transformBackendData(managers) as TeamManagerType[];
        dataCacheRef.current.managers = transformedManagers;
        setManagers(transformedManagers);
      }
    } catch (error: unknown) {
      // Silently handle manager fetch errors
      console.warn('Failed to fetch managers:', error);
    }
  }, [accountId, seasonId, teamSeasonId, token, setManagers, transformBackendData]);

  // Fetch season data
  const fetchSeasonData = useCallback(async () => {
    if (!accountId || !seasonId || !token) return;

    try {
      const result = await getAccountSeason({
        client: apiClient,
        path: { accountId, seasonId },
        throwOnError: false,
      });

      const seasonData = unwrapApiResult(result, 'Failed to fetch season data');
      setSeason({ id: seasonData.id, name: seasonData.name });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch season data');
      setError(errorMessage);
    }
  }, [accountId, seasonId, token, setSeason, setError, getErrorMessage, apiClient]);

  // Fetch league data
  const fetchLeagueData = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/league`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setLeague(response.data.data);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch league data');
      setError(errorMessage);
    }
  }, [accountId, seasonId, teamSeasonId, token, setLeague, setError, getErrorMessage]);

  // Update roster member with optimistic updates
  const updateRosterMember = useCallback(
    async (rosterMemberId: string, updates: RosterMemberUpdates) => {
      if (!rosterData) return;

      try {
        const result = await apiUpdateRosterMember({
          path: { accountId, seasonId, teamSeasonId, rosterMemberId },
          body: updates,
          client: apiClient,
          throwOnError: false,
        });

        const updatedMember = unwrapApiResult(
          result,
          'Failed to update roster information',
        ) as RosterMemberType;

        const updatedRosterData: TeamRosterMembersType = {
          ...dataCacheRef.current.rosterData!,
          rosterMembers: dataCacheRef.current.rosterData!.rosterMembers.map((member) =>
            member.id === rosterMemberId ? updatedMember : member,
          ),
        };

        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        setSuccessMessage('Roster information updated successfully');
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update roster information');
      }
    },
    [
      accountId,
      seasonId,
      teamSeasonId,
      rosterData,
      setRosterData,
      setSuccessMessage,
      setError,
      apiClient,
    ],
  );

  const getContactRoster = useCallback(
    async (contactId: string) => {
      if (!accountId || !contactId) return;

      const result = await apiGetContactRoster({
        path: { accountId, contactId },
        client: apiClient,
        throwOnError: false,
      });

      return unwrapApiResult(result, 'Failed to fetch contact roster') as RosterPlayerType;
    },
    [accountId, apiClient],
  );

  // Sign player with server response updates
  const signPlayer = useCallback(
    async (contactId: string, rosterData: SignRosterMemberType) => {
      if (!rosterData) return;

      try {
        const result = await apiSignPlayer({
          path: { accountId, seasonId, teamSeasonId },
          body: { ...rosterData, player: { ...rosterData.player, contact: { id: contactId } } },
          client: apiClient,
          throwOnError: false,
        });

        const newMember = unwrapApiResult(result, 'Failed to sign player') as RosterMemberType;

        const updatedRosterData: TeamRosterMembersType = {
          ...dataCacheRef.current.rosterData!,
          rosterMembers: [...dataCacheRef.current.rosterData!.rosterMembers, newMember],
        };

        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        setSuccessMessage('Player signed successfully');
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to sign player');
      }
    },
    [accountId, seasonId, teamSeasonId, setRosterData, setSuccessMessage, setError, apiClient],
  );

  // Release player with optimistic updates
  const releasePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!rosterData) return;

      try {
        const result = await apiReleasePlayer({
          path: { accountId, seasonId, teamSeasonId, rosterMemberId },
          client: apiClient,
          throwOnError: false,
        });

        assertNoApiError(result, 'Failed to release player');

        const updatedRosterData: TeamRosterMembersType = {
          ...dataCacheRef.current.rosterData!,
          rosterMembers: dataCacheRef.current.rosterData!.rosterMembers.map((member) =>
            member.id === rosterMemberId ? { ...member, inactive: true } : member,
          ),
        };

        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        setSuccessMessage('Player released successfully');
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to release player');
      }
    },
    [
      accountId,
      seasonId,
      teamSeasonId,
      rosterData,
      setRosterData,
      setSuccessMessage,
      setError,
      apiClient,
    ],
  );

  // Activate player with optimistic updates
  const activatePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!rosterData) return;

      try {
        const result = await apiActivatePlayer({
          path: { accountId, seasonId, teamSeasonId, rosterMemberId },
          client: apiClient,
          throwOnError: false,
        });

        assertNoApiError(result, 'Failed to activate player');

        const updatedRosterData: TeamRosterMembersType = {
          ...dataCacheRef.current.rosterData!,
          rosterMembers: dataCacheRef.current.rosterData!.rosterMembers.map((member) =>
            member.id === rosterMemberId ? { ...member, inactive: false } : member,
          ),
        };

        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        setSuccessMessage('Player activated successfully');
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to activate player');
      }
    },
    [
      accountId,
      seasonId,
      teamSeasonId,
      rosterData,
      setRosterData,
      setSuccessMessage,
      setError,
      apiClient,
    ],
  );

  // Delete player with optimistic updates
  const deletePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!rosterData) return;

      try {
        const result = await apiDeletePlayer({
          path: { accountId, seasonId, teamSeasonId, rosterMemberId },
          client: apiClient,
          throwOnError: false,
        });

        assertNoApiError(result, 'Failed to delete player');

        const updatedRosterData: TeamRosterMembersType = {
          ...dataCacheRef.current.rosterData!,
          rosterMembers: dataCacheRef.current.rosterData!.rosterMembers.filter(
            (member) => member.id !== rosterMemberId,
          ),
        };

        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        setSuccessMessage('Player deleted successfully');
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete player');
      }
    },
    [
      accountId,
      seasonId,
      teamSeasonId,
      rosterData,
      setRosterData,
      setSuccessMessage,
      setError,
      apiClient,
    ],
  );

  // Add manager with optimistic updates
  const addManager = useCallback(
    async (contactId: string) => {
      try {
        const result = await apiAddManager({
          path: { accountId, seasonId, teamSeasonId },
          body: { contactId: contactId },
          client: apiClient,
          throwOnError: false,
        });

        const newManager = unwrapApiResult(result, 'Failed to add manager') as TeamManagerType;

        const updatedManagers = [...managers, newManager];

        dataCacheRef.current.managers = updatedManagers;
        setManagers(updatedManagers);
        setSuccessMessage('Manager added successfully');
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to add manager');
      }
    },
    [
      accountId,
      seasonId,
      teamSeasonId,
      managers,
      setManagers,
      setSuccessMessage,
      setError,
      apiClient,
    ],
  );

  // Remove manager with optimistic updates
  const removeManager = useCallback(
    async (managerId: string) => {
      try {
        const result = await apiRemoveManager({
          path: { accountId, seasonId, teamSeasonId, managerId },
          client: apiClient,
          throwOnError: false,
        });

        assertNoApiError(result, 'Failed to remove manager');

        const updatedManagers = dataCacheRef.current.managers.filter(
          (manager) => manager.id !== managerId,
        );

        dataCacheRef.current.managers = updatedManagers;
        setManagers(updatedManagers);
        setSuccessMessage('Manager removed successfully');
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to remove manager');
      }
    },
    [accountId, seasonId, teamSeasonId, setManagers, setSuccessMessage, setError, apiClient],
  );

  // Delete contact photo with optimistic updates
  const deleteContactPhoto = useCallback(
    async (contactId: string) => {
      if (!rosterData) return;

      try {
        const result = await apiDeleteContactPhoto({
          path: { accountId, contactId },
          client: apiClient,
          throwOnError: false,
        });

        assertNoApiError(result, 'Failed to delete photo');

        const updatedRosterData: TeamRosterMembersType = {
          ...rosterData,
          rosterMembers: rosterData.rosterMembers.map((member) =>
            member.player.contact.id === contactId
              ? {
                  ...member,
                  player: {
                    ...member.player,
                    contact: { ...member.player.contact, photoUrl: undefined },
                  },
                }
              : member,
          ),
        };

        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        setSuccessMessage('Photo deleted successfully');
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete photo');
      }
    },
    [accountId, rosterData, setRosterData, setSuccessMessage, setError, apiClient],
  );

  // State management helpers
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, [setSuccessMessage]);

  return {
    rosterData,
    managers,
    season,
    league,
    loading,
    error,
    successMessage,
    fetchRosterData,
    fetchAvailablePlayers,
    fetchManagers,
    fetchSeasonData,
    fetchLeagueData,
    updateRosterMember,
    getContactRoster,
    signPlayer,
    releasePlayer,
    activatePlayer,
    deletePlayer,
    addManager,
    removeManager,
    deleteContactPhoto,
    clearError,
    clearSuccessMessage,
    setError,
    setSuccessMessage,
    setRosterData,
  };
};
