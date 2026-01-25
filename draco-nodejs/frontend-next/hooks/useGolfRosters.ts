'use client';

import {
  getGolfTeamRoster,
  listGolfSubstitutesForSeason,
  listAvailableGolfPlayers,
  getGolfRosterEntry,
  createAndSignGolfPlayer,
  signGolfPlayer,
  updateGolfPlayer,
  releaseGolfPlayer,
  deleteGolfPlayer,
} from '@draco/shared-api-client';
import type {
  GolfRosterEntryType,
  GolfSubstituteType,
  AvailablePlayerType,
  CreateGolfPlayerType,
  UpdateGolfPlayerType,
  SignPlayerType,
  ReleasePlayerType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type GolfRosterServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface GolfRosterService {
  getTeamRoster: (
    seasonId: string,
    teamSeasonId: string,
  ) => Promise<GolfRosterServiceResult<GolfRosterEntryType[]>>;
  listSubstitutesForSeason: (
    seasonId: string,
  ) => Promise<GolfRosterServiceResult<GolfSubstituteType[]>>;
  listAvailablePlayers: (
    seasonId: string,
  ) => Promise<GolfRosterServiceResult<AvailablePlayerType[]>>;
  getRosterEntry: (
    seasonId: string,
    rosterId: string,
  ) => Promise<GolfRosterServiceResult<GolfRosterEntryType>>;
  createAndSignPlayer: (
    seasonId: string,
    teamSeasonId: string,
    payload: CreateGolfPlayerType,
  ) => Promise<GolfRosterServiceResult<GolfRosterEntryType>>;
  signPlayer: (
    seasonId: string,
    teamSeasonId: string,
    payload: SignPlayerType,
  ) => Promise<GolfRosterServiceResult<GolfRosterEntryType>>;
  updatePlayer: (
    seasonId: string,
    rosterId: string,
    payload: UpdateGolfPlayerType,
  ) => Promise<GolfRosterServiceResult<GolfRosterEntryType>>;
  releasePlayer: (
    seasonId: string,
    rosterId: string,
    payload: ReleasePlayerType,
  ) => Promise<GolfRosterServiceResult<void>>;
  deletePlayer: (seasonId: string, rosterId: string) => Promise<GolfRosterServiceResult<void>>;
}

export function useGolfRosters(accountId: string): GolfRosterService {
  const apiClient = useApiClient();

  const getTeamRoster: GolfRosterService['getTeamRoster'] = async (seasonId, teamSeasonId) => {
    try {
      const result = await getGolfTeamRoster({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        throwOnError: false,
      });

      const roster = unwrapApiResult(result, 'Failed to load roster');

      return {
        success: true,
        data: roster as GolfRosterEntryType[],
        message: 'Roster loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load roster';
      return { success: false, error: message } as const;
    }
  };

  const listSubstitutesForSeason: GolfRosterService['listSubstitutesForSeason'] = async (
    seasonId,
  ) => {
    try {
      const result = await listGolfSubstitutesForSeason({
        client: apiClient,
        path: { accountId, seasonId },
        throwOnError: false,
      });

      const subs = unwrapApiResult(result, 'Failed to load substitutes');

      return {
        success: true,
        data: subs as GolfSubstituteType[],
        message: 'Substitutes loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load substitutes';
      return { success: false, error: message } as const;
    }
  };

  const listAvailablePlayers: GolfRosterService['listAvailablePlayers'] = async (seasonId) => {
    try {
      const result = await listAvailableGolfPlayers({
        client: apiClient,
        path: { accountId, seasonId },
        throwOnError: false,
      });

      const players = unwrapApiResult(result, 'Failed to load available players');

      return {
        success: true,
        data: players as AvailablePlayerType[],
        message: 'Available players loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load available players';
      return { success: false, error: message } as const;
    }
  };

  const getRosterEntry: GolfRosterService['getRosterEntry'] = async (seasonId, rosterId) => {
    try {
      const result = await getGolfRosterEntry({
        client: apiClient,
        path: { accountId, seasonId, rosterId },
        throwOnError: false,
      });

      const entry = unwrapApiResult(result, 'Failed to load roster entry');

      return {
        success: true,
        data: entry as GolfRosterEntryType,
        message: 'Roster entry loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load roster entry';
      return { success: false, error: message } as const;
    }
  };

  const createAndSignPlayer: GolfRosterService['createAndSignPlayer'] = async (
    seasonId,
    teamSeasonId,
    payload,
  ) => {
    try {
      const result = await createAndSignGolfPlayer({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        body: payload,
        throwOnError: false,
      });

      const entry = unwrapApiResult(
        result,
        'Failed to create and sign player',
      ) as GolfRosterEntryType;

      return {
        success: true,
        data: entry,
        message: 'Player created and signed successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create and sign player';
      return { success: false, error: message } as const;
    }
  };

  const signPlayer: GolfRosterService['signPlayer'] = async (seasonId, teamSeasonId, payload) => {
    try {
      const result = await signGolfPlayer({
        client: apiClient,
        path: { accountId, seasonId, teamSeasonId },
        body: payload,
        throwOnError: false,
      });

      const entry = unwrapApiResult(result, 'Failed to sign player') as GolfRosterEntryType;

      return {
        success: true,
        data: entry,
        message: 'Player signed successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign player';
      return { success: false, error: message } as const;
    }
  };

  const updatePlayer: GolfRosterService['updatePlayer'] = async (seasonId, rosterId, payload) => {
    try {
      const result = await updateGolfPlayer({
        client: apiClient,
        path: { accountId, seasonId, rosterId },
        body: payload,
        throwOnError: false,
      });

      const entry = unwrapApiResult(result, 'Failed to update player') as GolfRosterEntryType;

      return {
        success: true,
        data: entry,
        message: 'Player updated successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update player';
      return { success: false, error: message } as const;
    }
  };

  const releasePlayer: GolfRosterService['releasePlayer'] = async (seasonId, rosterId, payload) => {
    try {
      const result = await releaseGolfPlayer({
        client: apiClient,
        path: { accountId, seasonId, rosterId },
        body: payload,
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to release player');

      return {
        success: true,
        data: undefined as void,
        message: 'Player released successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to release player';
      return { success: false, error: message } as const;
    }
  };

  const deletePlayer: GolfRosterService['deletePlayer'] = async (seasonId, rosterId) => {
    try {
      const result = await deleteGolfPlayer({
        client: apiClient,
        path: { accountId, seasonId, rosterId },
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to delete player');

      return {
        success: true,
        data: undefined as void,
        message: 'Player deleted successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete player';
      return { success: false, error: message } as const;
    }
  };

  return {
    getTeamRoster,
    listSubstitutesForSeason,
    listAvailablePlayers,
    getRosterEntry,
    createAndSignPlayer,
    signPlayer,
    updatePlayer,
    releasePlayer,
    deletePlayer,
  };
}
