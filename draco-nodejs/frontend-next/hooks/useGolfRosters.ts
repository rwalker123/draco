'use client';

import { useCallback } from 'react';
import {
  getGolfTeamRoster,
  listGolfSubstitutesForSeason,
  listGolfSubstitutesForFlight,
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
  getTeamRoster: (teamSeasonId: string) => Promise<GolfRosterServiceResult<GolfRosterEntryType[]>>;
  listSubstitutesForSeason: (
    seasonId: string,
  ) => Promise<GolfRosterServiceResult<GolfSubstituteType[]>>;
  listSubstitutesForFlight: (
    flightId: string,
  ) => Promise<GolfRosterServiceResult<GolfSubstituteType[]>>;
  listAvailablePlayers: (
    seasonId: string,
  ) => Promise<GolfRosterServiceResult<AvailablePlayerType[]>>;
  getRosterEntry: (rosterId: string) => Promise<GolfRosterServiceResult<GolfRosterEntryType>>;
  createAndSignPlayer: (
    teamSeasonId: string,
    seasonId: string,
    payload: CreateGolfPlayerType,
  ) => Promise<GolfRosterServiceResult<GolfRosterEntryType>>;
  signPlayer: (
    teamSeasonId: string,
    seasonId: string,
    payload: SignPlayerType,
  ) => Promise<GolfRosterServiceResult<GolfRosterEntryType>>;
  updatePlayer: (
    rosterId: string,
    payload: UpdateGolfPlayerType,
  ) => Promise<GolfRosterServiceResult<GolfRosterEntryType>>;
  releasePlayer: (
    rosterId: string,
    seasonId: string,
    payload: ReleasePlayerType,
  ) => Promise<GolfRosterServiceResult<void>>;
  deletePlayer: (rosterId: string) => Promise<GolfRosterServiceResult<void>>;
}

export function useGolfRosters(accountId: string): GolfRosterService {
  const apiClient = useApiClient();

  const getTeamRoster = useCallback<GolfRosterService['getTeamRoster']>(
    async (teamSeasonId) => {
      try {
        const result = await getGolfTeamRoster({
          client: apiClient,
          path: { accountId, teamSeasonId },
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
    },
    [accountId, apiClient],
  );

  const listSubstitutesForSeason = useCallback<GolfRosterService['listSubstitutesForSeason']>(
    async (seasonId) => {
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
    },
    [accountId, apiClient],
  );

  const listSubstitutesForFlight = useCallback<GolfRosterService['listSubstitutesForFlight']>(
    async (flightId) => {
      try {
        const result = await listGolfSubstitutesForFlight({
          client: apiClient,
          path: { accountId, flightId },
          throwOnError: false,
        });

        const subs = unwrapApiResult(result, 'Failed to load flight substitutes');

        return {
          success: true,
          data: subs as GolfSubstituteType[],
          message: 'Flight substitutes loaded successfully',
        } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load flight substitutes';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const listAvailablePlayers = useCallback<GolfRosterService['listAvailablePlayers']>(
    async (seasonId) => {
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
    },
    [accountId, apiClient],
  );

  const getRosterEntry = useCallback<GolfRosterService['getRosterEntry']>(
    async (rosterId) => {
      try {
        const result = await getGolfRosterEntry({
          client: apiClient,
          path: { accountId, rosterId },
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
    },
    [accountId, apiClient],
  );

  const createAndSignPlayer = useCallback<GolfRosterService['createAndSignPlayer']>(
    async (teamSeasonId, seasonId, payload) => {
      try {
        const result = await createAndSignGolfPlayer({
          client: apiClient,
          path: { accountId, teamSeasonId },
          body: { ...payload, seasonId },
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
    },
    [accountId, apiClient],
  );

  const signPlayer = useCallback<GolfRosterService['signPlayer']>(
    async (teamSeasonId, seasonId, payload) => {
      try {
        const result = await signGolfPlayer({
          client: apiClient,
          path: { accountId, teamSeasonId },
          body: { ...payload, seasonId },
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
    },
    [accountId, apiClient],
  );

  const updatePlayer = useCallback<GolfRosterService['updatePlayer']>(
    async (rosterId, payload) => {
      try {
        const result = await updateGolfPlayer({
          client: apiClient,
          path: { accountId, rosterId },
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
    },
    [accountId, apiClient],
  );

  const releasePlayer = useCallback<GolfRosterService['releasePlayer']>(
    async (rosterId, seasonId, payload) => {
      try {
        const result = await releaseGolfPlayer({
          client: apiClient,
          path: { accountId, rosterId },
          body: { ...payload, seasonId },
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
    },
    [accountId, apiClient],
  );

  const deletePlayer = useCallback<GolfRosterService['deletePlayer']>(
    async (rosterId) => {
      try {
        const result = await deleteGolfPlayer({
          client: apiClient,
          path: { accountId, rosterId },
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
    },
    [accountId, apiClient],
  );

  return {
    getTeamRoster,
    listSubstitutesForSeason,
    listSubstitutesForFlight,
    listAvailablePlayers,
    getRosterEntry,
    createAndSignPlayer,
    signPlayer,
    updatePlayer,
    releasePlayer,
    deletePlayer,
  };
}
