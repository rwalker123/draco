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
import {
  applySeasonSchedule,
  createSchedulerFieldExclusionDate,
  createSchedulerFieldAvailabilityRule,
  deleteSchedulerFieldExclusionDate,
  deleteSchedulerFieldAvailabilityRule,
  getSchedulerProblemSpecPreview,
  listSchedulerFieldExclusionDates,
  listSchedulerFieldAvailabilityRules,
  solveSeasonSchedule,
  updateSchedulerFieldExclusionDate,
  updateSchedulerFieldAvailabilityRule,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';

export class SchedulerService {
  private readonly client: Client;

  constructor(token?: string | null, client?: Client) {
    this.client = client ?? createApiClient({ token: token ?? undefined });
  }

  async getProblemSpecPreview(
    accountId: string,
    seasonId: string,
  ): Promise<SchedulerProblemSpecPreview> {
    const result = await getSchedulerProblemSpecPreview({
      client: this.client,
      path: { accountId, seasonId },
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load scheduler problem spec preview');
  }

  async solveSeason(
    accountId: string,
    seasonId: string,
    request: SchedulerSeasonSolveRequest,
    options?: { idempotencyKey?: string },
  ): Promise<SchedulerSolveResult> {
    const result = await solveSeasonSchedule({
      client: this.client,
      path: { accountId, seasonId },
      body: request,
      headers: options?.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : undefined,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to generate schedule proposal');
  }

  async applySeason(
    accountId: string,
    seasonId: string,
    request: SchedulerSeasonApplyRequest,
  ): Promise<SchedulerApplyResult> {
    const result = await applySeasonSchedule({
      client: this.client,
      path: { accountId, seasonId },
      body: request,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to apply schedule proposal');
  }

  async listFieldAvailabilityRules(
    accountId: string,
    seasonId: string,
  ): Promise<SchedulerFieldAvailabilityRule[]> {
    const result = await listSchedulerFieldAvailabilityRules({
      client: this.client,
      path: { accountId, seasonId },
      throwOnError: false,
    });

    const payload = unwrapApiResult(result, 'Failed to load field availability rules');
    return payload.rules;
  }

  async listFieldExclusionDates(
    accountId: string,
    seasonId: string,
  ): Promise<SchedulerFieldExclusionDate[]> {
    const result = await listSchedulerFieldExclusionDates({
      client: this.client,
      path: { accountId, seasonId },
      throwOnError: false,
    });

    const payload = unwrapApiResult(result, 'Failed to load field exclusion dates');
    return payload.exclusions;
  }

  async createFieldAvailabilityRule(
    accountId: string,
    seasonId: string,
    input: SchedulerFieldAvailabilityRuleUpsert,
  ): Promise<SchedulerFieldAvailabilityRule> {
    const result = await createSchedulerFieldAvailabilityRule({
      client: this.client,
      path: { accountId, seasonId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to create field availability rule');
  }

  async createFieldExclusionDate(
    accountId: string,
    seasonId: string,
    input: SchedulerFieldExclusionDateUpsert,
  ): Promise<SchedulerFieldExclusionDate> {
    const result = await createSchedulerFieldExclusionDate({
      client: this.client,
      path: { accountId, seasonId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to create field exclusion date');
  }

  async updateFieldAvailabilityRule(
    accountId: string,
    seasonId: string,
    ruleId: string,
    input: SchedulerFieldAvailabilityRuleUpsert,
  ): Promise<SchedulerFieldAvailabilityRule> {
    const result = await updateSchedulerFieldAvailabilityRule({
      client: this.client,
      path: { accountId, seasonId, ruleId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update field availability rule');
  }

  async updateFieldExclusionDate(
    accountId: string,
    seasonId: string,
    exclusionId: string,
    input: SchedulerFieldExclusionDateUpsert,
  ): Promise<SchedulerFieldExclusionDate> {
    const result = await updateSchedulerFieldExclusionDate({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update field exclusion date');
  }

  async deleteFieldAvailabilityRule(
    accountId: string,
    seasonId: string,
    ruleId: string,
  ): Promise<void> {
    const result = await deleteSchedulerFieldAvailabilityRule({
      client: this.client,
      path: { accountId, seasonId, ruleId },
      throwOnError: false,
    });

    unwrapApiResult(result, 'Failed to delete field availability rule');
  }

  async deleteFieldExclusionDate(
    accountId: string,
    seasonId: string,
    exclusionId: string,
  ): Promise<void> {
    const result = await deleteSchedulerFieldExclusionDate({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      throwOnError: false,
    });

    unwrapApiResult(result, 'Failed to delete field exclusion date');
  }
}
