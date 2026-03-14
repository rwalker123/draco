'use client';

import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { ContactTransformationService } from '../services/contactTransformationService';
import {
  BaseContactType,
  RosterMemberType,
  RosterPlayerType,
  UpdateRosterMemberType,
} from '@draco/shared-schemas';
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
  getTeamRosterMembers as apiGetTeamRosterMembers,
  listAvailableRosterPlayers as apiListAvailableRosterPlayers,
  getAccountSeason,
  getTeamSeasonLeague as apiGetTeamSeasonLeague,
  listTeamManagers as apiListTeamManagers,
} from '@draco/shared-api-client';
import {
  TeamManagerType,
  TeamRosterMembersType,
  SignRosterMemberType,
} from '@draco/shared-schemas';
import {
  ApiClientError,
  assertNoApiError,
  getApiErrorMessage,
  unwrapApiResult,
} from '../utils/apiResult';

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
  submittedWaiver?: boolean;
  player?: {
    submittedDriversLicense?: boolean;
    firstYear?: number;
  };
}

interface OperationResult {
  success: boolean;
  message: string;
}

interface RosterDataManagerState {
  rosterData: TeamRosterMembersType;
  managers: TeamManagerType[];
  season: Season | null;
  league: League | null;
  loading: boolean;
  error: string | null;
}

interface RosterDataManagerActions {
  fetchRosterData: () => Promise<void>;
  fetchAvailablePlayers: (firstName?: string, lastName?: string) => Promise<BaseContactType[]>;
  fetchManagers: () => Promise<void>;
  fetchSeasonData: () => Promise<void>;
  fetchLeagueData: () => Promise<void>;

  updateRosterMember: (
    rosterMemberId: string,
    updates: RosterMemberUpdates,
  ) => Promise<OperationResult>;
  getContactRoster: (contactId: string) => Promise<RosterPlayerType | undefined>;
  signPlayer: (contactId: string, rosterData: SignRosterMemberType) => Promise<OperationResult>;
  releasePlayer: (rosterMemberId: string) => Promise<OperationResult>;
  activatePlayer: (rosterMemberId: string) => Promise<OperationResult>;
  deletePlayer: (rosterMemberId: string) => Promise<OperationResult>;
  addManager: (contactId: string) => Promise<OperationResult>;
  removeManager: (managerId: string) => Promise<OperationResult>;
  deleteContactPhoto: (contactId: string) => Promise<OperationResult>;

  clearError: () => void;
  setError: (error: string) => void;
  setRosterData: (data: TeamRosterMembersType) => void;
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  return getApiErrorMessage(error, defaultMessage);
};

export const useRosterDataManager = (
  options: UseRosterDataManagerOptions,
): RosterDataManagerState & RosterDataManagerActions => {
  const { accountId, seasonId, teamSeasonId } = options;
  const { token } = useAuth();
  const apiClient = useApiClient();

  const [rosterData, setRosterData] = useState<TeamRosterMembersType>({
    teamSeason: { id: teamSeasonId, name: '' },
    rosterMembers: [],
  });
  const [managers, setManagers] = useState<TeamManagerType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [season, setSeason] = useState<Season | null>(null);
  const [league, setLeague] = useState<League | null>(null);

  const dataCacheRef = useRef<{
    rosterData: TeamRosterMembersType | null;
    managers: TeamManagerType[];
  }>({
    rosterData: null,
    managers: [],
  });

  const transformBackendData = (data: unknown) => {
    if (!data) return data;

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

    if (Array.isArray(data)) {
      return data.map((item) => {
        const itemObj = item as Record<string, unknown>;
        if (itemObj.firstname || itemObj.lastname) {
          return ContactTransformationService.transformBackendContact(itemObj);
        }
        if (itemObj.firstName || itemObj.lastName) {
          return item;
        }
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
  };

  const fetchRosterData = async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) {
      if (!token) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiGetTeamRosterMembers({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        throwOnError: false,
      });

      const roster = unwrapApiResult(
        result,
        'Failed to fetch roster data',
      ) as TeamRosterMembersType;

      dataCacheRef.current.rosterData = roster;
      setRosterData(roster);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch roster data');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlayers = async (
    firstName?: string,
    lastName?: string,
  ): Promise<BaseContactType[]> => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return [];

    try {
      const result = await apiListAvailableRosterPlayers({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        query: {
          firstName: firstName?.trim() || undefined,
          lastName: lastName?.trim() || undefined,
        },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to fetch available players') ?? [];
      const transformed = transformBackendData(data) as BaseContactType[];
      return transformed || [];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof ApiClientError
          ? getApiErrorMessage(error.details ?? error, 'Failed to fetch available players')
          : getErrorMessage(error, 'Failed to fetch available players');
      console.error(errorMessage, error);
      return [];
    }
  };

  const fetchManagers = async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const result = await apiListTeamManagers({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        throwOnError: false,
      });

      const managers = unwrapApiResult(result, 'Failed to fetch managers') ?? [];
      const transformedManagers = transformBackendData(managers) as TeamManagerType[];
      dataCacheRef.current.managers = transformedManagers;
      setManagers(transformedManagers);
    } catch (error: unknown) {
      const message =
        error instanceof ApiClientError
          ? getApiErrorMessage(error.details ?? error, 'Failed to fetch managers')
          : getErrorMessage(error, 'Failed to fetch managers');
      console.warn(message, error);
    }
  };

  const fetchSeasonData = async () => {
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
  };

  const fetchLeagueData = async () => {
    if (!accountId || !seasonId || !teamSeasonId || !token) return;

    try {
      const result = await apiGetTeamSeasonLeague({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        throwOnError: false,
      });

      const leagueData = unwrapApiResult(result, 'Failed to fetch league data');

      setLeague(leagueData ? { id: leagueData.id, name: leagueData.name } : null);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch league data');
      setError(errorMessage);
    }
  };

  const updateRosterMember = async (
    rosterMemberId: string,
    updates: RosterMemberUpdates,
  ): Promise<OperationResult> => {
    if (!rosterData) return { success: false, message: 'No roster data available' };

    try {
      const sanitizedUpdates: UpdateRosterMemberType = {};

      if (updates.playerNumber !== undefined) {
        sanitizedUpdates.playerNumber = updates.playerNumber;
      }

      if (updates.submittedWaiver !== undefined) {
        sanitizedUpdates.submittedWaiver = updates.submittedWaiver;
      }

      if (updates.player) {
        const playerUpdates: NonNullable<UpdateRosterMemberType['player']> = {};

        if (updates.player.submittedDriversLicense !== undefined) {
          playerUpdates.submittedDriversLicense = updates.player.submittedDriversLicense;
        }

        if (updates.player.firstYear !== undefined) {
          playerUpdates.firstYear = updates.player.firstYear;
        }

        if (Object.keys(playerUpdates).length > 0) {
          sanitizedUpdates.player = playerUpdates;
        }
      }

      const result = await apiUpdateRosterMember({
        path: { accountId, seasonId, teamSeasonId, rosterMemberId },
        body: sanitizedUpdates,
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
      return { success: true, message: 'Roster information updated successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update roster information',
      };
    }
  };

  const getContactRoster = async (contactId: string) => {
    if (!accountId || !contactId) return;

    const result = await apiGetContactRoster({
      path: { accountId, contactId },
      client: apiClient,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to fetch contact roster') as RosterPlayerType;
  };

  const signPlayer = async (
    contactId: string,
    playerData: SignRosterMemberType,
  ): Promise<OperationResult> => {
    if (!dataCacheRef.current.rosterData)
      return { success: false, message: 'No roster data available' };

    try {
      const result = await apiSignPlayer({
        path: { accountId, seasonId, teamSeasonId },
        body: { ...playerData, player: { ...playerData.player, contact: { id: contactId } } },
        client: apiClient,
        throwOnError: false,
      });

      const newMember = unwrapApiResult(result, 'Failed to sign player') as RosterMemberType;

      const updatedRosterData: TeamRosterMembersType = {
        ...dataCacheRef.current.rosterData,
        rosterMembers: [...dataCacheRef.current.rosterData.rosterMembers, newMember],
      };

      dataCacheRef.current.rosterData = updatedRosterData;
      setRosterData(updatedRosterData);
      return { success: true, message: 'Player signed successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sign player',
      };
    }
  };

  const releasePlayer = async (rosterMemberId: string): Promise<OperationResult> => {
    if (!rosterData) return { success: false, message: 'No roster data available' };

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
      return { success: true, message: 'Player released successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to release player',
      };
    }
  };

  const activatePlayer = async (rosterMemberId: string): Promise<OperationResult> => {
    if (!rosterData) return { success: false, message: 'No roster data available' };

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
      return { success: true, message: 'Player activated successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate player',
      };
    }
  };

  const deletePlayer = async (rosterMemberId: string): Promise<OperationResult> => {
    if (!rosterData) return { success: false, message: 'No roster data available' };

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
      return { success: true, message: 'Player deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete player',
      };
    }
  };

  const addManager = async (contactId: string): Promise<OperationResult> => {
    try {
      const result = await apiAddManager({
        path: { accountId, seasonId, teamSeasonId },
        body: { contactId: contactId },
        client: apiClient,
        throwOnError: false,
      });

      const newManager = unwrapApiResult(result, 'Failed to add manager') as TeamManagerType;

      const updatedManagers = [...dataCacheRef.current.managers, newManager];

      dataCacheRef.current.managers = updatedManagers;
      setManagers(updatedManagers);
      return { success: true, message: 'Manager added successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add manager',
      };
    }
  };

  const removeManager = async (managerId: string): Promise<OperationResult> => {
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
      return { success: true, message: 'Manager removed successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove manager',
      };
    }
  };

  const deleteContactPhoto = async (contactId: string): Promise<OperationResult> => {
    if (!rosterData) return { success: false, message: 'No roster data available' };

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
      return { success: true, message: 'Photo deleted successfully' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete photo',
      };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    rosterData,
    managers,
    season,
    league,
    loading,
    error,
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
    setError,
    setRosterData,
  };
};
