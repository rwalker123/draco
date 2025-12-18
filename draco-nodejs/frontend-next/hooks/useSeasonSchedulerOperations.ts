'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
  SchedulerApplyResult,
  SchedulerFieldAvailabilityRule,
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDateUpsert,
  SchedulerProblemSpecPreview,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
  SchedulerSolveResult,
} from '@draco/shared-schemas';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { SchedulerService } from '../services/schedulerService';

export const useSeasonSchedulerOperations = (accountId: string, seasonId: string | null) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const service = useMemo(() => new SchedulerService(token, apiClient), [token, apiClient]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requireSeasonId = useCallback((): string => {
    if (!seasonId) {
      throw new Error('Missing current season. Please reload and try again.');
    }
    return seasonId;
  }, [seasonId]);

  const listFieldAvailabilityRules = useCallback(async (): Promise<
    SchedulerFieldAvailabilityRule[]
  > => {
    setLoading(true);
    setError(null);
    try {
      const resolvedSeasonId = requireSeasonId();
      return await service.listFieldAvailabilityRules(accountId, resolvedSeasonId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load field availability rules';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, requireSeasonId, service]);

  const getProblemSpecPreview = useCallback(async (): Promise<SchedulerProblemSpecPreview> => {
    setLoading(true);
    setError(null);
    try {
      const resolvedSeasonId = requireSeasonId();
      return await service.getProblemSpecPreview(accountId, resolvedSeasonId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load scheduler problem spec preview';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, requireSeasonId, service]);

  const createFieldAvailabilityRule = useCallback(
    async (
      input: SchedulerFieldAvailabilityRuleUpsert,
    ): Promise<SchedulerFieldAvailabilityRule> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.createFieldAvailabilityRule(accountId, resolvedSeasonId, input);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create field availability rule';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const updateFieldAvailabilityRule = useCallback(
    async (
      ruleId: string,
      input: SchedulerFieldAvailabilityRuleUpsert,
    ): Promise<SchedulerFieldAvailabilityRule> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.updateFieldAvailabilityRule(
          accountId,
          resolvedSeasonId,
          ruleId,
          input,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update field availability rule';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const deleteFieldAvailabilityRule = useCallback(
    async (ruleId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        await service.deleteFieldAvailabilityRule(accountId, resolvedSeasonId, ruleId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete field availability rule';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const listFieldExclusionDates = useCallback(async (): Promise<SchedulerFieldExclusionDate[]> => {
    setLoading(true);
    setError(null);
    try {
      const resolvedSeasonId = requireSeasonId();
      return await service.listFieldExclusionDates(accountId, resolvedSeasonId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load field exclusion dates';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, requireSeasonId, service]);

  const createFieldExclusionDate = useCallback(
    async (input: SchedulerFieldExclusionDateUpsert): Promise<SchedulerFieldExclusionDate> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.createFieldExclusionDate(accountId, resolvedSeasonId, input);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create field exclusion date';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const updateFieldExclusionDate = useCallback(
    async (
      exclusionId: string,
      input: SchedulerFieldExclusionDateUpsert,
    ): Promise<SchedulerFieldExclusionDate> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.updateFieldExclusionDate(
          accountId,
          resolvedSeasonId,
          exclusionId,
          input,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update field exclusion date';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const deleteFieldExclusionDate = useCallback(
    async (exclusionId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        await service.deleteFieldExclusionDate(accountId, resolvedSeasonId, exclusionId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete field exclusion date';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const solveSeason = useCallback(
    async (
      request: SchedulerSeasonSolveRequest,
      options?: { idempotencyKey?: string },
    ): Promise<SchedulerSolveResult> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.solveSeason(accountId, resolvedSeasonId, request, options);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate schedule proposal';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const applySeason = useCallback(
    async (request: SchedulerSeasonApplyRequest): Promise<SchedulerApplyResult> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.applySeason(accountId, resolvedSeasonId, request);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to apply schedule proposal';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    getProblemSpecPreview,
    listFieldAvailabilityRules,
    createFieldAvailabilityRule,
    updateFieldAvailabilityRule,
    deleteFieldAvailabilityRule,
    listFieldExclusionDates,
    createFieldExclusionDate,
    updateFieldExclusionDate,
    deleteFieldExclusionDate,
    solveSeason,
    applySeason,
    loading,
    error,
    clearError,
  };
};
