import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { ContactTransformationService } from '../services/contactTransformationService';
import { Contact, ContactType, CreateContactType, RosterPlayerType } from '@draco/shared-schemas';
import {
  updateRosterMember as apiUpdateRosterMember,
  updateContact as apiUpdateContact,
  createContact as apiCreateContact,
  signPlayer as apiSignPlayer,
  releasePlayer as apiReleasePlayer,
  activatePlayer as apiActivatePlayer,
  deletePlayer as apiDeletePlayer,
  addManager as apiAddManager,
  removeManager as apiRemoveManager,
  deleteContactPhoto as apiDeleteContactPhoto,
  getContactRoster as apiGetContactRoster,
} from '@draco/shared-api-client';
import {
  RosterMember,
  TeamManagerType,
  TeamRosterMembersType,
  SignRosterMemberType,
} from '@draco/shared-schemas';
import axios from 'axios';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { addCacheBuster } from '@/config/contacts';

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
  fetchAvailablePlayers: (firstName?: string, lastName?: string) => Promise<Contact[]>;
  fetchManagers: () => Promise<void>;
  fetchSeasonData: () => Promise<void>;
  fetchLeagueData: () => Promise<void>;

  // Operations with optimistic updates
  updateRosterMember: (rosterMemberId: string, updates: RosterMemberUpdates) => Promise<void>;
  updateContact: (
    contactId: string,
    contactData: CreateContactType | null,
    photoFile?: File | null,
  ) => Promise<ContactType | string>;
  getContactRoster: (contactId: string) => Promise<RosterPlayerType | undefined>;
  signPlayer: (contactId: string, rosterData: SignRosterMemberType) => Promise<void>;
  releasePlayer: (rosterMemberId: string) => Promise<void>;
  activatePlayer: (rosterMemberId: string) => Promise<void>;
  deletePlayer: (rosterMemberId: string) => Promise<void>;
  addManager: (contactId: string) => Promise<void>;
  removeManager: (managerId: string) => Promise<void>;
  createContact: (
    contactData: CreateContactType,
    photoFile?: File | null,
    autoSignToRoster?: boolean,
  ) => Promise<ContactType | string>;
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
  }, [
    accountId,
    seasonId,
    teamSeasonId,
    token,
    setRosterData,
    setLoading,
    setError,
    transformBackendData,
    getErrorMessage,
  ]);

  // Fetch available players - returns data directly instead of storing in state
  const fetchAvailablePlayers = useCallback(
    async (firstName?: string, lastName?: string): Promise<Contact[]> => {
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
      const response = await axios.get(`/api/accounts/${accountId}/seasons/${seasonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSeason(response.data.data.season);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch season data');
      setError(errorMessage);
    }
  }, [accountId, seasonId, token, setSeason, setError, getErrorMessage]);

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

      const result = await apiUpdateRosterMember({
        path: { accountId, seasonId, teamSeasonId, rosterMemberId },
        body: updates,
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
        // Update the specific roster member in the rosterMembers array
        // while preserving the TeamRosterData structure
        const updatedRosterData: TeamRosterMembersType = {
          ...dataCacheRef.current.rosterData!,
          rosterMembers: dataCacheRef.current.rosterData!.rosterMembers.map((member) =>
            member.id === rosterMemberId ? (result.data as RosterMember) : member,
          ),
        };

        // Update cache and state
        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        setSuccessMessage('Roster information updated successfully');
        setError(null);
      } else {
        setError(result?.error.message || 'Failed to update roster information');
      }
    },
    [accountId, seasonId, teamSeasonId, rosterData, setRosterData, setSuccessMessage, setError],
  );

  // Update contact with optimistic updates
  const updateContact = useCallback(
    async (
      contactId: string,
      contactData: CreateContactType | null,
      photoFile?: File | null,
    ): Promise<ContactType | string> => {
      if (!rosterData) {
        throw new Error('Service not initialized or no roster data available');
      }

      const result = photoFile
        ? await apiUpdateContact({
            path: { accountId, contactId },
            client: apiClient,
            body: { ...contactData, photo: photoFile },
            headers: {
              'Content-Type': null, // ✅ This deletes the hardcoded JSON content-type
            },
            ...formDataBodySerializer,
            throwOnError: false,
          })
        : await apiUpdateContact({
            path: { accountId, contactId },
            client: apiClient,
            body: { ...contactData, photo: undefined },
            throwOnError: false,
          });

      if (result.data) {
        // ✅ Add cache buster to photoUrl if a photo was uploaded
        const updatedContact = result.data as ContactType;
        if (photoFile && updatedContact.photoUrl) {
          updatedContact.photoUrl = addCacheBuster(updatedContact.photoUrl, Date.now());
        }

        // Update the specific contact data in the rosterMembers array
        // while preserving the TeamRosterData structure
        const updatedRosterData: TeamRosterMembersType = {
          ...rosterData,
          rosterMembers: rosterData.rosterMembers.map((member) =>
            member.player.contact.id === contactId
              ? { ...member, player: { ...member.player, contact: updatedContact } }
              : member,
          ),
        };

        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        if (contactData) {
          setSuccessMessage(
            `Player "${contactData.firstName} ${contactData.lastName}" updated successfully`,
          );
        } else {
          setSuccessMessage('Player photo updated successfully');
        }
        setError(null);
        return result.data as ContactType;
      } else {
        setError(result.error?.message || 'Failed to update player');
        setSuccessMessage(null);
        return result.error?.message;
      }
    },
    [accountId, rosterData, setRosterData, setSuccessMessage, setError],
  );

  const getContactRoster = useCallback(
    async (contactId: string) => {
      if (!accountId || !contactId) return;

      const result = await apiGetContactRoster({
        path: { accountId, contactId },
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
        return result.data as RosterPlayerType;
      } else {
        throw result.error;
      }
    },
    [accountId],
  );

  // Sign player with server response updates
  const signPlayer = useCallback(
    async (contactId: string, rosterData: SignRosterMemberType) => {
      if (!rosterData) return;

      const result = await apiSignPlayer({
        path: { accountId, seasonId, teamSeasonId },
        body: { ...rosterData, player: { ...rosterData.player, contact: { id: contactId } } },
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
        // Update the specific roster member in the rosterMembers array
        // while preserving the TeamRosterData structure
        const updatedRosterData: TeamRosterMembersType = {
          ...dataCacheRef.current.rosterData!,
          rosterMembers: [
            ...dataCacheRef.current.rosterData!.rosterMembers,
            result.data as RosterMember,
          ],
        };

        dataCacheRef.current.rosterData = updatedRosterData;
        setRosterData(updatedRosterData);
        setSuccessMessage('Player signed successfully');
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to sign player');
      }
    },
    [accountId, seasonId, teamSeasonId, rosterData, setRosterData, setSuccessMessage, setError],
  );

  // Release player with optimistic updates
  const releasePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!rosterData) return;

      const result = await apiReleasePlayer({
        path: { accountId, seasonId, teamSeasonId, rosterMemberId },
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
        // Update the specific roster member in the rosterMembers array
        // while preserving the TeamRosterData structure
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
      } else {
        setError(result.error?.message || 'Failed to release player');
      }
    },
    [accountId, seasonId, teamSeasonId, rosterData, setRosterData, setSuccessMessage, setError],
  );

  // Activate player with optimistic updates
  const activatePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!rosterData) return;

      const result = await apiActivatePlayer({
        path: { accountId, seasonId, teamSeasonId, rosterMemberId },
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
        // Update the specific roster member in the rosterMembers array
        // while preserving the TeamRosterData structure
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
      } else {
        setError(result.error?.message || 'Failed to activate player');
      }
    },
    [accountId, seasonId, teamSeasonId, rosterData, setRosterData, setSuccessMessage, setError],
  );

  // Delete player with optimistic updates
  const deletePlayer = useCallback(
    async (rosterMemberId: string) => {
      if (!rosterData) return;

      const result = await apiDeletePlayer({
        path: { accountId, seasonId, teamSeasonId, rosterMemberId },
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
        // Update the specific roster member in the rosterMembers array
        // while preserving the TeamRosterData structure
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
      } else {
        setError(result.error?.message || 'Failed to delete player');
      }
    },
    [accountId, seasonId, teamSeasonId, rosterData, setRosterData, setSuccessMessage, setError],
  );

  // Add manager with optimistic updates
  const addManager = useCallback(
    async (contactId: string) => {
      const result = await apiAddManager({
        path: { accountId, seasonId, teamSeasonId },
        body: { contact: { id: contactId } },
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
        //const newManager: ManagerType = result.data;

        // Update managers list with the new manager
        const updatedManagers = [...managers, result.data] as TeamManagerType[];

        dataCacheRef.current.managers = updatedManagers;
        setManagers(updatedManagers);
        setSuccessMessage('Manager added successfully');
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to add manager');
      }
    },
    [accountId, seasonId, teamSeasonId, managers, setManagers, setSuccessMessage, setError],
  );

  // Remove manager with optimistic updates
  const removeManager = useCallback(
    async (managerId: string) => {
      const result = await apiRemoveManager({
        path: { accountId, seasonId, teamSeasonId, managerId },
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
        const updatedManagers = dataCacheRef.current.managers.filter(
          (manager) => manager.id !== managerId,
        );

        dataCacheRef.current.managers = updatedManagers;
        setManagers(updatedManagers);
        setSuccessMessage('Manager removed successfully');
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to remove manager');
      }
    },
    [
      accountId,
      seasonId,
      teamSeasonId,
      dataCacheRef.current.managers,
      setManagers,
      setSuccessMessage,
      setError,
    ],
  );

  // Create contact with optimistic updates
  const createContact = useCallback(
    async (
      contactData: CreateContactType,
      photoFile?: File | null,
      autoSignToRoster?: boolean,
    ): Promise<ContactType | string> => {
      // create the contact with photo if provided
      const result = photoFile
        ? await apiCreateContact({
            path: { accountId },
            client: apiClient,
            body: { ...contactData, photo: photoFile },
            headers: {
              'Content-Type': null, // ✅ This deletes the hardcoded JSON content-type
            },
            ...formDataBodySerializer,
            throwOnError: false,
          })
        : await apiCreateContact({
            path: { accountId },
            client: apiClient,
            throwOnError: false,
            body: { ...contactData, photo: undefined },
          });

      // if the contact was created, sign the player to the roster if requested
      if (result.data) {
        if (autoSignToRoster && seasonId && teamSeasonId) {
          const signRosterData: SignRosterMemberType = {
            submittedWaiver: false,
            player: {
              submittedDriversLicense: false,
              firstYear: new Date().getFullYear(),
              contact: { id: result.data.id },
            },
          };

          const signPlayerResult = await apiSignPlayer({
            path: { accountId, seasonId, teamSeasonId },
            body: signRosterData,
            client: apiClient,
            throwOnError: false,
          });

          if (signPlayerResult.data) {
            // Add the new roster member to the current roster data
            const updatedRosterData: TeamRosterMembersType = {
              ...rosterData,
              rosterMembers: [...rosterData.rosterMembers, signPlayerResult.data],
            } as TeamRosterMembersType;

            dataCacheRef.current.rosterData = updatedRosterData;
            setRosterData(updatedRosterData);
            setSuccessMessage(
              autoSignToRoster
                ? `Player "${contactData.firstName} ${contactData.lastName}" created and signed to roster successfully`
                : `Player "${contactData.firstName} ${contactData.lastName}" created successfully`,
            );
          } else {
            // If no roster member was created, just show success message
            setSuccessMessage(
              `Player "${contactData.firstName} ${contactData.lastName}" created successfully`,
            );
          }
        }
        setError(null);
        return result.data as ContactType;
      } else {
        const errorMessage = result.error?.message || 'Failed to create player';
        setError(errorMessage);
        return errorMessage;
      }
    },
    [accountId, seasonId, teamSeasonId, rosterData, setRosterData, setSuccessMessage, setError],
  );

  // Delete contact photo with optimistic updates
  const deleteContactPhoto = useCallback(
    async (contactId: string) => {
      if (!rosterData) return;

      const result = await apiDeleteContactPhoto({
        path: { accountId, contactId },
        client: apiClient,
        throwOnError: false,
      });

      if (result.data) {
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
      } else {
        setError(result.error?.message || 'Failed to delete photo');
      }
    },
    [accountId, rosterData, setRosterData, setSuccessMessage, setError],
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
    updateContact,
    getContactRoster,
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
