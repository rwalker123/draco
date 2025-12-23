'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
  SchedulerApplyResult,
  SchedulerFieldAvailabilityRule,
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDateUpsert,
  SchedulerProblemSpecPreview,
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
  SchedulerSeasonWindowConfig,
  SchedulerSeasonWindowConfigUpsert,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
  SchedulerSolveResult,
  SchedulerTeamExclusion,
  SchedulerTeamExclusionUpsert,
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
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

  const getSeasonWindowConfig =
    useCallback(async (): Promise<SchedulerSeasonWindowConfig | null> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.getSeasonWindowConfig(accountId, resolvedSeasonId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load scheduler season window config';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    }, [accountId, requireSeasonId, service]);

  const upsertSeasonWindowConfig = useCallback(
    async (input: SchedulerSeasonWindowConfigUpsert): Promise<SchedulerSeasonWindowConfig> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.upsertSeasonWindowConfig(accountId, resolvedSeasonId, input);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to save scheduler season window config';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const listSeasonExclusions = useCallback(async (): Promise<SchedulerSeasonExclusion[]> => {
    setLoading(true);
    setError(null);
    try {
      const resolvedSeasonId = requireSeasonId();
      return await service.listSeasonExclusions(accountId, resolvedSeasonId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load season exclusions';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, requireSeasonId, service]);

  const createSeasonExclusion = useCallback(
    async (input: SchedulerSeasonExclusionUpsert): Promise<SchedulerSeasonExclusion> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.createSeasonExclusion(accountId, resolvedSeasonId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create season exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const updateSeasonExclusion = useCallback(
    async (
      exclusionId: string,
      input: SchedulerSeasonExclusionUpsert,
    ): Promise<SchedulerSeasonExclusion> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.updateSeasonExclusion(accountId, resolvedSeasonId, exclusionId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update season exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const deleteSeasonExclusion = useCallback(
    async (exclusionId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        await service.deleteSeasonExclusion(accountId, resolvedSeasonId, exclusionId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete season exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const listTeamExclusions = useCallback(async (): Promise<SchedulerTeamExclusion[]> => {
    setLoading(true);
    setError(null);
    try {
      const resolvedSeasonId = requireSeasonId();
      return await service.listTeamExclusions(accountId, resolvedSeasonId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load team exclusions';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, requireSeasonId, service]);

  const createTeamExclusion = useCallback(
    async (input: SchedulerTeamExclusionUpsert): Promise<SchedulerTeamExclusion> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.createTeamExclusion(accountId, resolvedSeasonId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create team exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const updateTeamExclusion = useCallback(
    async (
      exclusionId: string,
      input: SchedulerTeamExclusionUpsert,
    ): Promise<SchedulerTeamExclusion> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.updateTeamExclusion(accountId, resolvedSeasonId, exclusionId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update team exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const deleteTeamExclusion = useCallback(
    async (exclusionId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        await service.deleteTeamExclusion(accountId, resolvedSeasonId, exclusionId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete team exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const listUmpireExclusions = useCallback(async (): Promise<SchedulerUmpireExclusion[]> => {
    setLoading(true);
    setError(null);
    try {
      const resolvedSeasonId = requireSeasonId();
      return await service.listUmpireExclusions(accountId, resolvedSeasonId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load umpire exclusions';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, requireSeasonId, service]);

  const createUmpireExclusion = useCallback(
    async (input: SchedulerUmpireExclusionUpsert): Promise<SchedulerUmpireExclusion> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.createUmpireExclusion(accountId, resolvedSeasonId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create umpire exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const updateUmpireExclusion = useCallback(
    async (
      exclusionId: string,
      input: SchedulerUmpireExclusionUpsert,
    ): Promise<SchedulerUmpireExclusion> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        return await service.updateUmpireExclusion(accountId, resolvedSeasonId, exclusionId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update umpire exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

  const deleteUmpireExclusion = useCallback(
    async (exclusionId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const resolvedSeasonId = requireSeasonId();
        await service.deleteUmpireExclusion(accountId, resolvedSeasonId, exclusionId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete umpire exclusion';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, requireSeasonId, service],
  );

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
    getSeasonWindowConfig,
    upsertSeasonWindowConfig,
    listFieldAvailabilityRules,
    createFieldAvailabilityRule,
    updateFieldAvailabilityRule,
    deleteFieldAvailabilityRule,
    listFieldExclusionDates,
    createFieldExclusionDate,
    updateFieldExclusionDate,
    deleteFieldExclusionDate,
    listSeasonExclusions,
    createSeasonExclusion,
    updateSeasonExclusion,
    deleteSeasonExclusion,
    listTeamExclusions,
    createTeamExclusion,
    updateTeamExclusion,
    deleteTeamExclusion,
    listUmpireExclusions,
    createUmpireExclusion,
    updateUmpireExclusion,
    deleteUmpireExclusion,
    solveSeason,
    applySeason,
    loading,
    error,
    clearError,
  };
};
