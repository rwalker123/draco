'use client';

import { useRef, useState } from 'react';
import type {
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldExclusionDateUpsert,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonExclusionUpsert,
  SchedulerSeasonSolveRequest,
  SchedulerSeasonWindowConfigUpsert,
  SchedulerTeamExclusionUpsert,
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
    const getContext = () => {
      const { seasonId: sid, token: t, apiClient: c, accountId: aid } = depsRef.current;
      if (!sid) throw new Error('Missing current season. Please reload and try again.');
      return { service: new SchedulerService(t, c), accountId: aid, seasonId: sid };
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
        setLoading(false);
      }
    };

    const list =
      <T>(call: (s: SchedulerService, a: string, i: string, signal?: AbortSignal) => Promise<T>) =>
      (signal?: AbortSignal): Promise<T> =>
        run(() => {
          const { service, accountId, seasonId } = getContext();
          return call(service, accountId, seasonId, signal);
        }, signal);

    const mutate =
      <TArgs extends unknown[], TResult>(
        call: (s: SchedulerService, a: string, i: string, ...args: TArgs) => Promise<TResult>,
      ) =>
      (...args: TArgs): Promise<TResult> =>
        run(() => {
          const { service, accountId, seasonId } = getContext();
          return call(service, accountId, seasonId, ...args);
        });

    return {
      getProblemSpecPreview: mutate((s, a, i) => s.getProblemSpecPreview(a, i)),
      getSeasonWindowConfig: list((s, a, i, signal) => s.getSeasonWindowConfig(a, i, signal)),
      upsertSeasonWindowConfig: mutate((s, a, i, input: SchedulerSeasonWindowConfigUpsert) =>
        s.upsertSeasonWindowConfig(a, i, input),
      ),
      listFieldAvailabilityRules: list((s, a, i, signal) =>
        s.listFieldAvailabilityRules(a, i, signal),
      ),
      createFieldAvailabilityRule: mutate((s, a, i, input: SchedulerFieldAvailabilityRuleUpsert) =>
        s.createFieldAvailabilityRule(a, i, input),
      ),
      updateFieldAvailabilityRule: mutate(
        (s, a, i, ruleId: string, input: SchedulerFieldAvailabilityRuleUpsert) =>
          s.updateFieldAvailabilityRule(a, i, ruleId, input),
      ),
      deleteFieldAvailabilityRule: mutate((s, a, i, ruleId: string) =>
        s.deleteFieldAvailabilityRule(a, i, ruleId),
      ),
      listFieldExclusionDates: list((s, a, i, signal) => s.listFieldExclusionDates(a, i, signal)),
      createFieldExclusionDate: mutate((s, a, i, input: SchedulerFieldExclusionDateUpsert) =>
        s.createFieldExclusionDate(a, i, input),
      ),
      updateFieldExclusionDate: mutate(
        (s, a, i, exclusionId: string, input: SchedulerFieldExclusionDateUpsert) =>
          s.updateFieldExclusionDate(a, i, exclusionId, input),
      ),
      deleteFieldExclusionDate: mutate((s, a, i, exclusionId: string) =>
        s.deleteFieldExclusionDate(a, i, exclusionId),
      ),
      listSeasonExclusions: list((s, a, i, signal) => s.listSeasonExclusions(a, i, signal)),
      createSeasonExclusion: mutate((s, a, i, input: SchedulerSeasonExclusionUpsert) =>
        s.createSeasonExclusion(a, i, input),
      ),
      updateSeasonExclusion: mutate(
        (s, a, i, exclusionId: string, input: SchedulerSeasonExclusionUpsert) =>
          s.updateSeasonExclusion(a, i, exclusionId, input),
      ),
      deleteSeasonExclusion: mutate((s, a, i, exclusionId: string) =>
        s.deleteSeasonExclusion(a, i, exclusionId),
      ),
      listTeamExclusions: list((s, a, i, signal) => s.listTeamExclusions(a, i, signal)),
      createTeamExclusion: mutate((s, a, i, input: SchedulerTeamExclusionUpsert) =>
        s.createTeamExclusion(a, i, input),
      ),
      updateTeamExclusion: mutate(
        (s, a, i, exclusionId: string, input: SchedulerTeamExclusionUpsert) =>
          s.updateTeamExclusion(a, i, exclusionId, input),
      ),
      deleteTeamExclusion: mutate((s, a, i, exclusionId: string) =>
        s.deleteTeamExclusion(a, i, exclusionId),
      ),
      listUmpireExclusions: list((s, a, i, signal) => s.listUmpireExclusions(a, i, signal)),
      createUmpireExclusion: mutate((s, a, i, input: SchedulerUmpireExclusionUpsert) =>
        s.createUmpireExclusion(a, i, input),
      ),
      updateUmpireExclusion: mutate(
        (s, a, i, exclusionId: string, input: SchedulerUmpireExclusionUpsert) =>
          s.updateUmpireExclusion(a, i, exclusionId, input),
      ),
      deleteUmpireExclusion: mutate((s, a, i, exclusionId: string) =>
        s.deleteUmpireExclusion(a, i, exclusionId),
      ),
      solveSeason: mutate(
        (s, a, i, request: SchedulerSeasonSolveRequest, options?: { idempotencyKey?: string }) =>
          s.solveSeason(a, i, request, options),
      ),
      applySeason: mutate((s, a, i, request: SchedulerSeasonApplyRequest) =>
        s.applySeason(a, i, request),
      ),
      clearError: () => setError(null),
    };
  });

  return { ...operations, loading, error };
};
