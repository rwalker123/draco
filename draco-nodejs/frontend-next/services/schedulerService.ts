import type {
  SchedulerApplyResult,
  SchedulerFieldAvailabilityRule,
  SchedulerFieldAvailabilityRuleUpsert,
  SchedulerFieldExclusionDate,
  SchedulerFieldExclusionDateUpsert,
  SchedulerProblemSpecPreview,
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
  SchedulerSeasonExclusions,
  SchedulerSeasonWindowConfig,
  SchedulerSeasonWindowConfigUpsert,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
  SchedulerSolveResult,
  SchedulerTeamExclusion,
  SchedulerTeamExclusionUpsert,
  SchedulerTeamExclusions,
  SchedulerUmpireExclusion,
  SchedulerUmpireExclusionUpsert,
  SchedulerUmpireExclusions,
} from '@draco/shared-schemas';
import {
  applySeasonSchedule,
  createSchedulerFieldExclusionDate,
  createSchedulerFieldAvailabilityRule,
  createSchedulerSeasonExclusion,
  createSchedulerTeamExclusion,
  createSchedulerUmpireExclusion,
  deleteSchedulerFieldExclusionDate,
  deleteSchedulerFieldAvailabilityRule,
  deleteSchedulerSeasonExclusion,
  deleteSchedulerTeamExclusion,
  deleteSchedulerUmpireExclusion,
  getSchedulerProblemSpecPreview,
  getSchedulerSeasonWindowConfig,
  listSchedulerFieldExclusionDates,
  listSchedulerFieldAvailabilityRules,
  listSchedulerSeasonExclusions,
  listSchedulerTeamExclusions,
  listSchedulerUmpireExclusions,
  solveSeasonSchedule,
  upsertSchedulerSeasonWindowConfig,
  updateSchedulerFieldExclusionDate,
  updateSchedulerFieldAvailabilityRule,
  updateSchedulerSeasonExclusion,
  updateSchedulerTeamExclusion,
  updateSchedulerUmpireExclusion,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { createApiClient } from '../lib/apiClientFactory';
import { ApiClientError, unwrapApiResult } from '../utils/apiResult';

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

  async getSeasonWindowConfig(
    accountId: string,
    seasonId: string,
  ): Promise<SchedulerSeasonWindowConfig | null> {
    const result = await getSchedulerSeasonWindowConfig({
      client: this.client,
      path: { accountId, seasonId },
      throwOnError: false,
    });

    try {
      return unwrapApiResult(result, 'Failed to load scheduler season window config');
    } catch (err) {
      if (err instanceof ApiClientError) {
        const status = err.status;
        if (status === 404) {
          return null;
        }
      }
      throw err;
    }
  }

  async upsertSeasonWindowConfig(
    accountId: string,
    seasonId: string,
    input: SchedulerSeasonWindowConfigUpsert,
  ): Promise<SchedulerSeasonWindowConfig> {
    const result = await upsertSchedulerSeasonWindowConfig({
      client: this.client,
      path: { accountId, seasonId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to save scheduler season window config');
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

  async listSeasonExclusions(
    accountId: string,
    seasonId: string,
  ): Promise<SchedulerSeasonExclusion[]> {
    const result = await listSchedulerSeasonExclusions({
      client: this.client,
      path: { accountId, seasonId },
      throwOnError: false,
    });

    const payload: SchedulerSeasonExclusions = unwrapApiResult(
      result,
      'Failed to load season exclusions',
    );
    return payload.exclusions;
  }

  async createSeasonExclusion(
    accountId: string,
    seasonId: string,
    input: SchedulerSeasonExclusionUpsert,
  ): Promise<SchedulerSeasonExclusion> {
    const result = await createSchedulerSeasonExclusion({
      client: this.client,
      path: { accountId, seasonId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to create season exclusion');
  }

  async updateSeasonExclusion(
    accountId: string,
    seasonId: string,
    exclusionId: string,
    input: SchedulerSeasonExclusionUpsert,
  ): Promise<SchedulerSeasonExclusion> {
    const result = await updateSchedulerSeasonExclusion({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update season exclusion');
  }

  async deleteSeasonExclusion(
    accountId: string,
    seasonId: string,
    exclusionId: string,
  ): Promise<void> {
    const result = await deleteSchedulerSeasonExclusion({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      throwOnError: false,
    });

    unwrapApiResult(result, 'Failed to delete season exclusion');
  }

  async listTeamExclusions(accountId: string, seasonId: string): Promise<SchedulerTeamExclusion[]> {
    const result = await listSchedulerTeamExclusions({
      client: this.client,
      path: { accountId, seasonId },
      throwOnError: false,
    });

    const payload: SchedulerTeamExclusions = unwrapApiResult(
      result,
      'Failed to load team exclusions',
    );
    return payload.exclusions;
  }

  async createTeamExclusion(
    accountId: string,
    seasonId: string,
    input: SchedulerTeamExclusionUpsert,
  ): Promise<SchedulerTeamExclusion> {
    const result = await createSchedulerTeamExclusion({
      client: this.client,
      path: { accountId, seasonId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to create team exclusion');
  }

  async updateTeamExclusion(
    accountId: string,
    seasonId: string,
    exclusionId: string,
    input: SchedulerTeamExclusionUpsert,
  ): Promise<SchedulerTeamExclusion> {
    const result = await updateSchedulerTeamExclusion({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update team exclusion');
  }

  async deleteTeamExclusion(
    accountId: string,
    seasonId: string,
    exclusionId: string,
  ): Promise<void> {
    const result = await deleteSchedulerTeamExclusion({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      throwOnError: false,
    });

    unwrapApiResult(result, 'Failed to delete team exclusion');
  }

  async listUmpireExclusions(
    accountId: string,
    seasonId: string,
  ): Promise<SchedulerUmpireExclusion[]> {
    const result = await listSchedulerUmpireExclusions({
      client: this.client,
      path: { accountId, seasonId },
      throwOnError: false,
    });

    const payload: SchedulerUmpireExclusions = unwrapApiResult(
      result,
      'Failed to load umpire exclusions',
    );
    return payload.exclusions;
  }

  async createUmpireExclusion(
    accountId: string,
    seasonId: string,
    input: SchedulerUmpireExclusionUpsert,
  ): Promise<SchedulerUmpireExclusion> {
    const result = await createSchedulerUmpireExclusion({
      client: this.client,
      path: { accountId, seasonId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to create umpire exclusion');
  }

  async updateUmpireExclusion(
    accountId: string,
    seasonId: string,
    exclusionId: string,
    input: SchedulerUmpireExclusionUpsert,
  ): Promise<SchedulerUmpireExclusion> {
    const result = await updateSchedulerUmpireExclusion({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update umpire exclusion');
  }

  async deleteUmpireExclusion(
    accountId: string,
    seasonId: string,
    exclusionId: string,
  ): Promise<void> {
    const result = await deleteSchedulerUmpireExclusion({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      throwOnError: false,
    });

    unwrapApiResult(result, 'Failed to delete umpire exclusion');
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
