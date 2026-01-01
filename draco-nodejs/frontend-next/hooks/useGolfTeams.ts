'use client';

import { useCallback, useMemo } from 'react';
import {
  listGolfTeams,
  listUnassignedGolfTeams,
  listGolfTeamsForFlight,
  getGolfTeam,
  getGolfTeamWithRoster,
  createGolfTeam,
  updateGolfTeam,
  assignGolfTeamToFlight,
  removeGolfTeamFromFlight,
  deleteGolfTeam,
} from '@draco/shared-api-client';
import type {
  GolfTeamType,
  GolfTeamWithPlayerCountType,
  GolfTeamWithRosterType,
  CreateGolfTeamType,
  UpdateGolfTeamType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type GolfTeamServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface GolfTeamService {
  listTeams: (seasonId: string) => Promise<GolfTeamServiceResult<GolfTeamType[]>>;
  listUnassignedTeams: (seasonId: string) => Promise<GolfTeamServiceResult<GolfTeamType[]>>;
  listTeamsForFlight: (
    flightId: string,
  ) => Promise<GolfTeamServiceResult<GolfTeamWithPlayerCountType[]>>;
  getTeam: (teamSeasonId: string) => Promise<GolfTeamServiceResult<GolfTeamType>>;
  getTeamWithRoster: (
    teamSeasonId: string,
  ) => Promise<GolfTeamServiceResult<GolfTeamWithRosterType>>;
  createTeam: (
    seasonId: string,
    leagueSeasonId: string,
    payload: CreateGolfTeamType,
  ) => Promise<GolfTeamServiceResult<GolfTeamType>>;
  updateTeam: (
    teamSeasonId: string,
    payload: UpdateGolfTeamType,
  ) => Promise<GolfTeamServiceResult<GolfTeamType>>;
  assignToFlight: (
    teamSeasonId: string,
    flightId: string,
  ) => Promise<GolfTeamServiceResult<GolfTeamType>>;
  removeFromFlight: (teamSeasonId: string) => Promise<GolfTeamServiceResult<GolfTeamType>>;
  deleteTeam: (teamSeasonId: string) => Promise<GolfTeamServiceResult<void>>;
}

export function useGolfTeams(accountId: string): GolfTeamService {
  const apiClient = useApiClient();

  const listTeams = useCallback<GolfTeamService['listTeams']>(
    async (seasonId) => {
      try {
        const result = await listGolfTeams({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });

        const teams = unwrapApiResult(result, 'Failed to load teams');

        return {
          success: true,
          data: teams as GolfTeamType[],
          message: 'Teams loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load teams';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const listUnassignedTeams = useCallback<GolfTeamService['listUnassignedTeams']>(
    async (seasonId) => {
      try {
        const result = await listUnassignedGolfTeams({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });

        const teams = unwrapApiResult(result, 'Failed to load unassigned teams');

        return {
          success: true,
          data: teams as GolfTeamType[],
          message: 'Unassigned teams loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load unassigned teams';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const listTeamsForFlight = useCallback<GolfTeamService['listTeamsForFlight']>(
    async (flightId) => {
      try {
        const result = await listGolfTeamsForFlight({
          client: apiClient,
          path: { accountId, flightId },
          throwOnError: false,
        });

        const teams = unwrapApiResult(result, 'Failed to load flight teams');

        return {
          success: true,
          data: teams as GolfTeamWithPlayerCountType[],
          message: 'Flight teams loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load flight teams';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const getTeam = useCallback<GolfTeamService['getTeam']>(
    async (teamSeasonId) => {
      try {
        const result = await getGolfTeam({
          client: apiClient,
          path: { accountId, teamSeasonId },
          throwOnError: false,
        });

        const team = unwrapApiResult(result, 'Failed to load team');

        return {
          success: true,
          data: team as GolfTeamType,
          message: 'Team loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load team';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const getTeamWithRoster = useCallback<GolfTeamService['getTeamWithRoster']>(
    async (teamSeasonId) => {
      try {
        const result = await getGolfTeamWithRoster({
          client: apiClient,
          path: { accountId, teamSeasonId },
          throwOnError: false,
        });

        const team = unwrapApiResult(result, 'Failed to load team with roster');

        return {
          success: true,
          data: team as GolfTeamWithRosterType,
          message: 'Team with roster loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load team with roster';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const createTeam = useCallback<GolfTeamService['createTeam']>(
    async (seasonId, leagueSeasonId, payload) => {
      try {
        const result = await createGolfTeam({
          client: apiClient,
          path: { accountId, seasonId, leagueSeasonId },
          body: payload,
          throwOnError: false,
        });

        const team = unwrapApiResult(result, 'Failed to create team') as GolfTeamType;

        return {
          success: true,
          data: team,
          message: 'Team created successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create team';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const updateTeam = useCallback<GolfTeamService['updateTeam']>(
    async (teamSeasonId, payload) => {
      try {
        const result = await updateGolfTeam({
          client: apiClient,
          path: { accountId, teamSeasonId },
          body: payload,
          throwOnError: false,
        });

        const team = unwrapApiResult(result, 'Failed to update team') as GolfTeamType;

        return {
          success: true,
          data: team,
          message: 'Team updated successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update team';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const assignToFlight = useCallback<GolfTeamService['assignToFlight']>(
    async (teamSeasonId, flightId) => {
      try {
        const result = await assignGolfTeamToFlight({
          client: apiClient,
          path: { accountId, teamSeasonId, flightId },
          throwOnError: false,
        });

        const team = unwrapApiResult(result, 'Failed to assign team to flight') as GolfTeamType;

        return {
          success: true,
          data: team,
          message: 'Team assigned to flight successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to assign team to flight';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const removeFromFlight = useCallback<GolfTeamService['removeFromFlight']>(
    async (teamSeasonId) => {
      try {
        const result = await removeGolfTeamFromFlight({
          client: apiClient,
          path: { accountId, teamSeasonId },
          throwOnError: false,
        });

        const team = unwrapApiResult(result, 'Failed to remove team from flight') as GolfTeamType;

        return {
          success: true,
          data: team,
          message: 'Team removed from flight successfully',
        } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to remove team from flight';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const deleteTeam = useCallback<GolfTeamService['deleteTeam']>(
    async (teamSeasonId) => {
      try {
        const result = await deleteGolfTeam({
          client: apiClient,
          path: { accountId, teamSeasonId },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to delete team');

        return {
          success: true,
          data: undefined as void,
          message: 'Team deleted successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete team';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  return useMemo(
    () => ({
      listTeams,
      listUnassignedTeams,
      listTeamsForFlight,
      getTeam,
      getTeamWithRoster,
      createTeam,
      updateTeam,
      assignToFlight,
      removeFromFlight,
      deleteTeam,
    }),
    [
      listTeams,
      listUnassignedTeams,
      listTeamsForFlight,
      getTeam,
      getTeamWithRoster,
      createTeam,
      updateTeam,
      assignToFlight,
      removeFromFlight,
      deleteTeam,
    ],
  );
}
