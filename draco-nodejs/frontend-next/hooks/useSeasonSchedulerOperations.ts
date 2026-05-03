'use client';

import { useRef, useState } from 'react';
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

const isAbortError = (err: unknown, signal?: AbortSignal): boolean => {
  if (signal?.aborted) return true;
  if (
    typeof DOMException !== 'undefined' &&
    err instanceof DOMException &&
    err.name === 'AbortError'
  ) {
    return true;
  }
  if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
    return true;
  }
  return false;
};

export const useSeasonSchedulerOperations = (accountId: string, seasonId: string | null) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depsRef = useRef({ token, apiClient, accountId, seasonId });
  depsRef.current = { token, apiClient, accountId, seasonId };

  const [operations] = useState(() => {
    const getService = () => new SchedulerService(depsRef.current.token, depsRef.current.apiClient);

    const requireSeasonId = (): string => {
      if (!depsRef.current.seasonId) {
        throw new Error('Missing current season. Please reload and try again.');
      }
      return depsRef.current.seasonId;
    };

    const run = async <T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (err) {
        if (isAbortError(err, signal)) throw err;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw new Error(message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    };

    const listFieldAvailabilityRules = (
      signal?: AbortSignal,
    ): Promise<SchedulerFieldAvailabilityRule[]> =>
      run(async () => {
        const s = getService();
        return s.listFieldAvailabilityRules(depsRef.current.accountId, requireSeasonId(), signal);
      }, signal);

    const getProblemSpecPreview = (): Promise<SchedulerProblemSpecPreview> =>
      run(() => {
        const s = getService();
        return s.getProblemSpecPreview(depsRef.current.accountId, requireSeasonId());
      });

    const getSeasonWindowConfig = (
      signal?: AbortSignal,
    ): Promise<SchedulerSeasonWindowConfig | null> =>
      run(async () => {
        const s = getService();
        return s.getSeasonWindowConfig(depsRef.current.accountId, requireSeasonId(), signal);
      }, signal);

    const upsertSeasonWindowConfig = (
      input: SchedulerSeasonWindowConfigUpsert,
    ): Promise<SchedulerSeasonWindowConfig> =>
      run(() => {
        const s = getService();
        return s.upsertSeasonWindowConfig(depsRef.current.accountId, requireSeasonId(), input);
      });

    const listSeasonExclusions = (signal?: AbortSignal): Promise<SchedulerSeasonExclusion[]> =>
      run(async () => {
        const s = getService();
        return s.listSeasonExclusions(depsRef.current.accountId, requireSeasonId(), signal);
      }, signal);

    const createSeasonExclusion = (
      input: SchedulerSeasonExclusionUpsert,
    ): Promise<SchedulerSeasonExclusion> =>
      run(() => {
        const s = getService();
        return s.createSeasonExclusion(depsRef.current.accountId, requireSeasonId(), input);
      });

    const updateSeasonExclusion = (
      exclusionId: string,
      input: SchedulerSeasonExclusionUpsert,
    ): Promise<SchedulerSeasonExclusion> =>
      run(() => {
        const s = getService();
        return s.updateSeasonExclusion(
          depsRef.current.accountId,
          requireSeasonId(),
          exclusionId,
          input,
        );
      });

    const deleteSeasonExclusion = (exclusionId: string): Promise<void> =>
      run(() => {
        const s = getService();
        return s.deleteSeasonExclusion(depsRef.current.accountId, requireSeasonId(), exclusionId);
      });

    const listTeamExclusions = (signal?: AbortSignal): Promise<SchedulerTeamExclusion[]> =>
      run(async () => {
        const s = getService();
        return s.listTeamExclusions(depsRef.current.accountId, requireSeasonId(), signal);
      }, signal);

    const createTeamExclusion = (
      input: SchedulerTeamExclusionUpsert,
    ): Promise<SchedulerTeamExclusion> =>
      run(() => {
        const s = getService();
        return s.createTeamExclusion(depsRef.current.accountId, requireSeasonId(), input);
      });

    const updateTeamExclusion = (
      exclusionId: string,
      input: SchedulerTeamExclusionUpsert,
    ): Promise<SchedulerTeamExclusion> =>
      run(() => {
        const s = getService();
        return s.updateTeamExclusion(
          depsRef.current.accountId,
          requireSeasonId(),
          exclusionId,
          input,
        );
      });

    const deleteTeamExclusion = (exclusionId: string): Promise<void> =>
      run(() => {
        const s = getService();
        return s.deleteTeamExclusion(depsRef.current.accountId, requireSeasonId(), exclusionId);
      });

    const listUmpireExclusions = (signal?: AbortSignal): Promise<SchedulerUmpireExclusion[]> =>
      run(async () => {
        const s = getService();
        return s.listUmpireExclusions(depsRef.current.accountId, requireSeasonId(), signal);
      }, signal);

    const createUmpireExclusion = (
      input: SchedulerUmpireExclusionUpsert,
    ): Promise<SchedulerUmpireExclusion> =>
      run(() => {
        const s = getService();
        return s.createUmpireExclusion(depsRef.current.accountId, requireSeasonId(), input);
      });

    const updateUmpireExclusion = (
      exclusionId: string,
      input: SchedulerUmpireExclusionUpsert,
    ): Promise<SchedulerUmpireExclusion> =>
      run(() => {
        const s = getService();
        return s.updateUmpireExclusion(
          depsRef.current.accountId,
          requireSeasonId(),
          exclusionId,
          input,
        );
      });

    const deleteUmpireExclusion = (exclusionId: string): Promise<void> =>
      run(() => {
        const s = getService();
        return s.deleteUmpireExclusion(depsRef.current.accountId, requireSeasonId(), exclusionId);
      });

    const createFieldAvailabilityRule = (
      input: SchedulerFieldAvailabilityRuleUpsert,
    ): Promise<SchedulerFieldAvailabilityRule> =>
      run(() => {
        const s = getService();
        return s.createFieldAvailabilityRule(depsRef.current.accountId, requireSeasonId(), input);
      });

    const updateFieldAvailabilityRule = (
      ruleId: string,
      input: SchedulerFieldAvailabilityRuleUpsert,
    ): Promise<SchedulerFieldAvailabilityRule> =>
      run(() => {
        const s = getService();
        return s.updateFieldAvailabilityRule(
          depsRef.current.accountId,
          requireSeasonId(),
          ruleId,
          input,
        );
      });

    const deleteFieldAvailabilityRule = (ruleId: string): Promise<void> =>
      run(() => {
        const s = getService();
        return s.deleteFieldAvailabilityRule(depsRef.current.accountId, requireSeasonId(), ruleId);
      });

    const listFieldExclusionDates = (
      signal?: AbortSignal,
    ): Promise<SchedulerFieldExclusionDate[]> =>
      run(async () => {
        const s = getService();
        return s.listFieldExclusionDates(depsRef.current.accountId, requireSeasonId(), signal);
      }, signal);

    const createFieldExclusionDate = (
      input: SchedulerFieldExclusionDateUpsert,
    ): Promise<SchedulerFieldExclusionDate> =>
      run(() => {
        const s = getService();
        return s.createFieldExclusionDate(depsRef.current.accountId, requireSeasonId(), input);
      });

    const updateFieldExclusionDate = (
      exclusionId: string,
      input: SchedulerFieldExclusionDateUpsert,
    ): Promise<SchedulerFieldExclusionDate> =>
      run(() => {
        const s = getService();
        return s.updateFieldExclusionDate(
          depsRef.current.accountId,
          requireSeasonId(),
          exclusionId,
          input,
        );
      });

    const deleteFieldExclusionDate = (exclusionId: string): Promise<void> =>
      run(() => {
        const s = getService();
        return s.deleteFieldExclusionDate(
          depsRef.current.accountId,
          requireSeasonId(),
          exclusionId,
        );
      });

    const solveSeason = (
      request: SchedulerSeasonSolveRequest,
      options?: { idempotencyKey?: string },
    ): Promise<SchedulerSolveResult> =>
      run(() => {
        const s = getService();
        return s.solveSeason(depsRef.current.accountId, requireSeasonId(), request, options);
      });

    const applySeason = (request: SchedulerSeasonApplyRequest): Promise<SchedulerApplyResult> =>
      run(() => {
        const s = getService();
        return s.applySeason(depsRef.current.accountId, requireSeasonId(), request);
      });

    const clearError = () => setError(null);

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
      clearError,
    };
  });

  return {
    ...operations,
    loading,
    error,
  };
};
