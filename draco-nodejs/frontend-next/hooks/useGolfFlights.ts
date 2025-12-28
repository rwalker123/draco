'use client';

import { useCallback } from 'react';
import {
  listGolfFlights,
  listGolfFlightsForLeagueSeason,
  createGolfFlight,
  updateGolfFlight,
  deleteGolfFlight,
} from '@draco/shared-api-client';
import type {
  GolfFlightWithTeamCountType,
  GolfFlightType,
  CreateGolfFlightType,
  UpdateGolfFlightType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type GolfFlightServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface GolfFlightService {
  listFlights: (
    seasonId: string,
  ) => Promise<GolfFlightServiceResult<GolfFlightWithTeamCountType[]>>;
  listFlightsForLeagueSeason: (
    seasonId: string,
    leagueSeasonId: string,
  ) => Promise<GolfFlightServiceResult<GolfFlightWithTeamCountType[]>>;
  createFlight: (
    seasonId: string,
    leagueSeasonId: string,
    payload: CreateGolfFlightType,
  ) => Promise<GolfFlightServiceResult<GolfFlightType>>;
  updateFlight: (
    flightId: string,
    payload: UpdateGolfFlightType,
  ) => Promise<GolfFlightServiceResult<GolfFlightType>>;
  deleteFlight: (flightId: string) => Promise<GolfFlightServiceResult<void>>;
}

export function useGolfFlights(accountId: string): GolfFlightService {
  const apiClient = useApiClient();

  const listFlights = useCallback<GolfFlightService['listFlights']>(
    async (seasonId) => {
      try {
        const result = await listGolfFlights({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });

        const flights = unwrapApiResult(result, 'Failed to load flights');

        return {
          success: true,
          data: flights as GolfFlightWithTeamCountType[],
          message: 'Flights loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load flights';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const listFlightsForLeagueSeason = useCallback<GolfFlightService['listFlightsForLeagueSeason']>(
    async (seasonId, leagueSeasonId) => {
      try {
        const result = await listGolfFlightsForLeagueSeason({
          client: apiClient,
          path: { accountId, seasonId, leagueSeasonId },
          throwOnError: false,
        });

        const flights = unwrapApiResult(result, 'Failed to load flights');

        return {
          success: true,
          data: flights as GolfFlightWithTeamCountType[],
          message: 'Flights loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load flights';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const createFlight = useCallback<GolfFlightService['createFlight']>(
    async (seasonId, leagueSeasonId, payload) => {
      try {
        const result = await createGolfFlight({
          client: apiClient,
          path: { accountId, seasonId, leagueSeasonId },
          body: payload,
          throwOnError: false,
        });

        const flight = unwrapApiResult(result, 'Failed to create flight') as GolfFlightType;

        return {
          success: true,
          data: flight,
          message: 'Flight created successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create flight';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const updateFlight = useCallback<GolfFlightService['updateFlight']>(
    async (flightId, payload) => {
      try {
        const result = await updateGolfFlight({
          client: apiClient,
          path: { accountId, flightId },
          body: payload,
          throwOnError: false,
        });

        const flight = unwrapApiResult(result, 'Failed to update flight') as GolfFlightType;

        return {
          success: true,
          data: flight,
          message: 'Flight updated successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update flight';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const deleteFlight = useCallback<GolfFlightService['deleteFlight']>(
    async (flightId) => {
      try {
        const result = await deleteGolfFlight({
          client: apiClient,
          path: { accountId, flightId },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to delete flight');

        return {
          success: true,
          data: undefined as void,
          message: 'Flight deleted successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete flight';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  return {
    listFlights,
    listFlightsForLeagueSeason,
    createFlight,
    updateFlight,
    deleteFlight,
  };
}
