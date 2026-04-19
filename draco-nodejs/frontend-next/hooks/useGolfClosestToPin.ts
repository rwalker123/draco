'use client';

import { useState } from 'react';
import {
  getGolfClosestToPinForMatch,
  getGolfClosestToPinForFlight,
  createGolfClosestToPin,
  updateGolfClosestToPin,
  deleteGolfClosestToPin,
} from '@draco/shared-api-client';
import type {
  GolfClosestToPinEntryType,
  CreateGolfClosestToPinType,
  UpdateGolfClosestToPinType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';

export type GolfCtpResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export function useGolfClosestToPin(accountId: string) {
  const [loading, setLoading] = useState(false);
  const apiClient = useApiClient();

  const getForMatch = async (
    matchId: string,
    signal?: AbortSignal,
  ): Promise<GolfCtpResult<GolfClosestToPinEntryType[]>> => {
    try {
      const result = await getGolfClosestToPinForMatch({
        client: apiClient,
        path: { accountId, matchId },
        signal,
        throwOnError: false,
      });

      if (result.error) {
        const errorObj = result.error as { message?: string };
        return { success: false, error: errorObj?.message ?? 'Failed to load CTP entries' };
      }

      return {
        success: true,
        data: result.data ?? [],
        message: 'CTP entries loaded successfully',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load CTP entries',
      };
    }
  };

  const getForFlight = async (
    flightId: string,
    signal?: AbortSignal,
  ): Promise<GolfCtpResult<GolfClosestToPinEntryType[]>> => {
    try {
      const result = await getGolfClosestToPinForFlight({
        client: apiClient,
        path: { accountId, flightId },
        signal,
        throwOnError: false,
      });

      if (result.error) {
        const errorObj = result.error as { message?: string };
        return { success: false, error: errorObj?.message ?? 'Failed to load CTP entries' };
      }

      return {
        success: true,
        data: result.data ?? [],
        message: 'CTP entries loaded successfully',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load CTP entries',
      };
    }
  };

  const createEntry = async (
    matchId: string,
    data: CreateGolfClosestToPinType,
    signal?: AbortSignal,
  ): Promise<GolfCtpResult<GolfClosestToPinEntryType>> => {
    setLoading(true);
    try {
      const result = await createGolfClosestToPin({
        client: apiClient,
        path: { accountId, matchId },
        body: data,
        signal,
        throwOnError: false,
      });

      if (result.error) {
        const errorObj = result.error as { message?: string };
        return { success: false, error: errorObj?.message ?? 'Failed to create CTP entry' };
      }

      if (result.data === undefined) {
        return { success: false, error: 'Failed to create CTP entry' };
      }

      return { success: true, data: result.data, message: 'CTP entry created successfully' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create CTP entry',
      };
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (
    ctpId: string,
    data: UpdateGolfClosestToPinType,
    signal?: AbortSignal,
  ): Promise<GolfCtpResult<GolfClosestToPinEntryType>> => {
    setLoading(true);
    try {
      const result = await updateGolfClosestToPin({
        client: apiClient,
        path: { accountId, ctpId },
        body: data,
        signal,
        throwOnError: false,
      });

      if (result.error) {
        const errorObj = result.error as { message?: string };
        return { success: false, error: errorObj?.message ?? 'Failed to update CTP entry' };
      }

      if (result.data === undefined) {
        return { success: false, error: 'Failed to update CTP entry' };
      }

      return { success: true, data: result.data, message: 'CTP entry updated successfully' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update CTP entry',
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (ctpId: string, signal?: AbortSignal): Promise<GolfCtpResult<void>> => {
    setLoading(true);
    try {
      const result = await deleteGolfClosestToPin({
        client: apiClient,
        path: { accountId, ctpId },
        signal,
        throwOnError: false,
      });

      if (result.error) {
        const errorObj = result.error as { message?: string };
        return { success: false, error: errorObj?.message ?? 'Failed to delete CTP entry' };
      }

      return { success: true, data: undefined, message: 'CTP entry deleted successfully' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete CTP entry',
      };
    } finally {
      setLoading(false);
    }
  };

  return { getForMatch, getForFlight, createEntry, updateEntry, deleteEntry, loading };
}
