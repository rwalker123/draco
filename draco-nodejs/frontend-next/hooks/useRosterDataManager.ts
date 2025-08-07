import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  RosterOperationsService,
  TeamRosterData,
  ManagerType,
  RosterFormData,
  RosterMember,
} from '../services/rosterOperationsService';
import { ContactTransformationService } from '../services/contactTransformationService';
import { ContactUpdateData, Contact } from '../types/users';
import axios from 'axios';

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

interface RosterDataManagerState {
  rosterData: TeamRosterData | null;
  availablePlayers: Contact[];
  managers: ManagerType[];
  season: Season | null;
  league: League | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

interface RosterDataManagerActions {
  // Data fetching
  fetchRosterData: () => Promise<void>;
  fetchAvailablePlayers: () => Promise<void>;
  fetchManagers: () => Promise<void>;
  fetchSeasonData: () => Promise<void>;
  fetchLeagueData: () => Promise<void>;

  // Operations with optimistic updates
  updateRosterMember: (rosterMemberId: string, updates: RosterMemberUpdates) => Promise<void>;
  updateContact: (
    contactId: string,
    contactData: ContactUpdateData,
    photoFile?: File | null,
  ) => Promise<void>;
  signPlayer: (contactId: string, rosterData: RosterFormData) => Promise<void>;
  releasePlayer: (rosterMemberId: string) => Promise<void>;
  activatePlayer: (rosterMemberId: string) => Promise<void>;
  deletePlayer: (rosterMemberId: string) => Promise<void>;
  addManager: (contactId: string) => Promise<void>;
  removeManager: (managerId: string) => Promise<void>;
  createContact: (
    contactData: ContactUpdateData,
    photoFile?: File | null,
    autoSignToRoster?: boolean,
  ) => Promise<void>;
  deleteContactPhoto: (contactId: string) => Promise<void>;

  // State management
  clearError: () => void;
  clearSuccessMessage: () => void;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
}

export const useRosterDataManager = (
  options: UseRosterDataManagerOptions,
): RosterDataManagerState & RosterDataManagerActions => {
  const { accountId, seasonId, teamSeasonId } = options;
  const { token } = useAuth();

  // State
  const [state, setState] = useState<RosterDataManagerState>({
    rosterData: null,
    availablePlayers: [],
    managers: [],
    season: null,
    league: null,
    loading: true,
    error: null,
    successMessage: null,
  });

  // Refs for service and data caching
  const serviceRef = useRef<RosterOperationsService | null>(null);
  const dataCacheRef = useRef<{
    rosterData: TeamRosterData | null;
    availablePlayers: Contact[];
    managers: ManagerType[];
  }>({
    rosterData: null,
    availablePlayers: [],
    managers: [],
  });

  // Initialize service when token changes
  useEffect(() => {
    if (token) {
      serviceRef.current = new RosterOperationsService(token);
    }
  }, [token]);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<RosterDataManagerState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

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
  const transformBackendData = useCallback((data: TeamRosterData) => {
    if (!data) return data;

    if (data.rosterMembers) {
      return {
        ...data,
        rosterMembers: data.rosterMembers.map((member: RosterMember) => ({
          ...member,
          player: {
            ...member.player,
            contact: ContactTransformationService.transformBackendContact(member.player?.contact),
          },
        })),
      };
    }

    if (Array.isArray(data)) {
      // Handle available players (ContactEntry[] from backend)
      return data.map((item: Contact) => {
        // If it's a ContactEntry (has firstName, lastName, etc.), transform it
        if (item.firstName || item.firstname) {
          return ContactTransformationService.transformBackendContact(item);
        }
        // Otherwise, handle as before
        return {
          ...item,
          contact: item.contact
            ? ContactTransformationService.transformBackendContact(item.contact)
            : item.contact,
          contacts: item.contacts
            ? ContactTransformationService.transformBackendContact(item.contacts)
            : item.contacts,
        };
      });
    }

    return data;
  }, []);

  // Fetch roster data
  const fetchRosterData = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    updateState({ loading: true, error: null });

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/roster`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const transformedData = transformBackendData(response.data.data);
        dataCacheRef.current.rosterData = transformedData;
        updateState({ rosterData: transformedData, loading: false });
      } else {
        updateState({
          error: response.data.message || 'Failed to fetch roster data',
          loading: false,
        });
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch roster data');
      updateState({ error: errorMessage, loading: false });
    }
  }, [
    accountId,
    seasonId,
    teamSeasonId,
    token,
    updateState,
    transformBackendData,
    getErrorMessage,
  ]);

  // Fetch available players
  const fetchAvailablePlayers = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/available-players`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const players = response.data.data.availablePlayers || [];
        const transformedPlayers = transformBackendData(players);
        dataCacheRef.current.availablePlayers = transformedPlayers;
        updateState({ availablePlayers: transformedPlayers });
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch available players');
      updateState({ error: errorMessage });
    }
  }, [
    accountId,
    seasonId,
    teamSeasonId,
    token,
    updateState,
    transformBackendData,
    getErrorMessage,
  ]);

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
        const transformedManagers = transformBackendData(managers);
        dataCacheRef.current.managers = transformedManagers;
        updateState({ managers: transformedManagers });
      }
    } catch (error: unknown) {
      // Silently handle manager fetch errors
      console.warn('Failed to fetch managers:', error);
    }
  }, [accountId, seasonId, teamSeasonId, token, updateState, transformBackendData]);

  // Fetch season data
  const fetchSeasonData = useCallback(async () => {
    if (!accountId || !seasonId || !token) return;

    try {
      const response = await axios.get(`/api/accounts/${accountId}/seasons/${seasonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        updateState({ season: response.data.data.season });
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch season data');
      updateState({ error: errorMessage });
    }
  }, [accountId, seasonId, token, updateState, getErrorMessage]);

  // Fetch league data
  const fetchLeagueData = useCallback(async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const response = await axios.get(
        `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/league`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        updateState({ league: response.data.data });
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch league data');
      updateState({ error: errorMessage });
    }
  }, [accountId, seasonId, teamSeasonId, token, updateState, getErrorMessage]);

  // Update roster member with optimistic updates
  const updateRosterMember = useCallback(
    async (rosterMemberId: string, updates: RosterMemberUpdates) => {
      if (!serviceRef.current || !state.rosterData) return;

      const result = await serviceRef.current.updateRosterMember(
        accountId,
        seasonId,
        teamSeasonId,
        rosterMemberId,
        updates,
        state.rosterData,
      );

      if (result.success && result.data) {
        dataCacheRef.current.rosterData = result.data;
        updateState({
          rosterData: result.data,
          successMessage: 'Roster information updated successfully',
          error: null,
        });
      } else {
        updateState({ error: result.error || 'Failed to update roster information' });
      }
    },
    [accountId, seasonId, teamSeasonId, state.rosterData, updateState],
  );

  // Update contact with optimistic updates
  const updateContact = useCallback(
    async (contactId: string, contactData: ContactUpdateData, photoFile?: File | null) => {
      if (!serviceRef.current || !state.rosterData) {
        throw new Error('Service not initialized or no roster data available');
      }

      const result = await serviceRef.current.updateContact(
        accountId,
        contactId,
        contactData,
        state.rosterData,
        photoFile,
      );

      if (result.success && result.data) {
        dataCacheRef.current.rosterData = result.data;
        updateState({
          rosterData: result.data,
          successMessage: `Player "${contactData.firstName} ${contactData.lastName}" updated successfully`,
          error: null,
        });
      } else {
        // Create an error object that matches what UserManagementService throws
        const error = new Error(result.error || 'Failed to update contact');
        throw error;
      }
    },
    [accountId, state.rosterData, updateState],
  );

  // Sign player with optimistic updates
  const signPlayer = useCallback(
    async (contactId: string, rosterData: RosterFormData) => {
      if (!serviceRef.current || !state.rosterData) return;

      const result = await serviceRef.current.signPlayer(
        accountId,
        seasonId,
        teamSeasonId,
        contactId,
        rosterData,
        state.rosterData,
        state.availablePlayers,
      );

      if (result.success && result.data) {
        dataCacheRef.current.rosterData = result.data.rosterData;
        dataCacheRef.current.availablePlayers = result.data.availablePlayers;
        updateState({
          rosterData: result.data.rosterData,
          availablePlayers: result.data.availablePlayers,
          successMessage: 'Player signed successfully',
          error: null,
        });
      } else {
        updateState({ error: result.error || 'Failed to sign player' });
      }
    },
    [accountId, seasonId, teamSeasonId, state.rosterData, state.availablePlayers, updateState],
  );

  // Release player with optimistic updates
  const releasePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!serviceRef.current || !state.rosterData) return;

      const result = await serviceRef.current.releasePlayer(
        accountId,
        seasonId,
        teamSeasonId,
        rosterMemberId,
        state.rosterData,
      );

      if (result.success && result.data) {
        dataCacheRef.current.rosterData = result.data;
        updateState({
          rosterData: result.data,
          successMessage: 'Player released successfully',
          error: null,
        });
      } else {
        updateState({ error: result.error || 'Failed to release player' });
      }
    },
    [accountId, seasonId, teamSeasonId, state.rosterData, updateState],
  );

  // Activate player with optimistic updates
  const activatePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!serviceRef.current || !state.rosterData) return;

      const result = await serviceRef.current.activatePlayer(
        accountId,
        seasonId,
        teamSeasonId,
        rosterMemberId,
        state.rosterData,
      );

      if (result.success && result.data) {
        dataCacheRef.current.rosterData = result.data;
        updateState({
          rosterData: result.data,
          successMessage: 'Player activated successfully',
          error: null,
        });
      } else {
        updateState({ error: result.error || 'Failed to activate player' });
      }
    },
    [accountId, seasonId, teamSeasonId, state.rosterData, updateState],
  );

  // Delete player with optimistic updates
  const deletePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!serviceRef.current || !state.rosterData) return;

      const result = await serviceRef.current.deletePlayer(
        accountId,
        seasonId,
        teamSeasonId,
        rosterMemberId,
        state.rosterData,
      );

      if (result.success && result.data) {
        dataCacheRef.current.rosterData = result.data;
        updateState({
          rosterData: result.data,
          successMessage: 'Player deleted successfully',
          error: null,
        });
      } else {
        updateState({ error: result.error || 'Failed to delete player' });
      }
    },
    [accountId, seasonId, teamSeasonId, state.rosterData, updateState],
  );

  // Add manager with optimistic updates
  const addManager = useCallback(
    async (contactId: string) => {
      if (!serviceRef.current) return;

      const result = await serviceRef.current.addManager(
        accountId,
        seasonId,
        teamSeasonId,
        contactId,
        state.managers,
      );

      if (result.success && result.data) {
        dataCacheRef.current.managers = result.data;
        updateState({
          managers: result.data,
          successMessage: 'Manager added successfully',
          error: null,
        });
      } else {
        updateState({ error: result.error || 'Failed to add manager' });
      }
    },
    [accountId, seasonId, teamSeasonId, state.managers, updateState],
  );

  // Remove manager with optimistic updates
  const removeManager = useCallback(
    async (managerId: string) => {
      if (!serviceRef.current) return;

      const result = await serviceRef.current.removeManager(
        accountId,
        seasonId,
        teamSeasonId,
        managerId,
        state.managers,
      );

      if (result.success && result.data) {
        dataCacheRef.current.managers = result.data;
        updateState({
          managers: result.data,
          successMessage: 'Manager removed successfully',
          error: null,
        });
      } else {
        updateState({ error: result.error || 'Failed to remove manager' });
      }
    },
    [accountId, seasonId, teamSeasonId, state.managers, updateState],
  );

  // Create contact with optimistic updates
  const createContact = useCallback(
    async (contactData: ContactUpdateData, photoFile?: File | null, autoSignToRoster?: boolean) => {
      if (!serviceRef.current) {
        throw new Error('Service not initialized');
      }

      const result = await serviceRef.current.createContact(
        accountId,
        contactData,
        photoFile,
        autoSignToRoster,
        seasonId,
        teamSeasonId,
      );

      if (result.success && result.data) {
        // Use optimistic updates instead of full data refreshes
        if (result.data.rosterMember && state.rosterData) {
          // Add the new roster member to the current roster data
          const updatedRosterData = {
            ...state.rosterData,
            rosterMembers: [...state.rosterData.rosterMembers, result.data.rosterMember],
          };

          dataCacheRef.current.rosterData = updatedRosterData;
          updateState({
            rosterData: updatedRosterData,
            successMessage: autoSignToRoster
              ? `Player "${contactData.firstName} ${contactData.lastName}" created and signed to roster successfully`
              : `Player "${contactData.firstName} ${contactData.lastName}" created successfully`,
            error: null,
          });
        } else {
          // If no roster member was created, just show success message
          updateState({
            successMessage: `Player "${contactData.firstName} ${contactData.lastName}" created successfully`,
            error: null,
          });
        }
      } else {
        // Create an error object that matches what UserManagementService throws
        const error = new Error(result.error || 'Failed to create contact');
        throw error;
      }
    },
    [accountId, seasonId, teamSeasonId, state.rosterData, updateState],
  );

  // Delete contact photo with optimistic updates
  const deleteContactPhoto = useCallback(
    async (contactId: string) => {
      if (!serviceRef.current || !state.rosterData) return;

      const result = await serviceRef.current.deleteContactPhoto(
        accountId,
        contactId,
        state.rosterData,
      );

      if (result.success && result.data) {
        dataCacheRef.current.rosterData = result.data;
        updateState({
          rosterData: result.data,
          successMessage: 'Photo deleted successfully',
          error: null,
        });
      } else {
        updateState({ error: result.error || 'Failed to delete photo' });
      }
    },
    [accountId, state.rosterData, updateState],
  );

  // State management helpers
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearSuccessMessage = useCallback(() => {
    updateState({ successMessage: null });
  }, [updateState]);

  const setError = useCallback(
    (error: string) => {
      updateState({ error });
    },
    [updateState],
  );

  const setSuccessMessage = useCallback(
    (message: string) => {
      updateState({ successMessage: message });
    },
    [updateState],
  );

  return {
    ...state,
    fetchRosterData,
    fetchAvailablePlayers,
    fetchManagers,
    fetchSeasonData,
    fetchLeagueData,
    updateRosterMember,
    updateContact,
    signPlayer,
    releasePlayer,
    activatePlayer,
    deletePlayer,
    addManager,
    removeManager,
    createContact,
    deleteContactPhoto,
    clearError,
    clearSuccessMessage,
    setError,
    setSuccessMessage,
  };
};
