import type {
  SchedulerApplyResult,
  SchedulerGenerateMatchupsRequest,
  SchedulerGenerateMatchupsResult,
  SchedulerLeagueExclusion,
  SchedulerLeagueExclusionUpsert,
  SchedulerLeagueExclusions,
  SchedulerProblemSpecPreview,
  SchedulerSeasonExclusion,
  SchedulerSeasonExclusionUpsert,
  SchedulerSeasonExclusions,
  SchedulerSeasonWindowConfig,
  SchedulerSeasonWindowConfigUpsert,
  SchedulerSeasonApplyRequest,
  SchedulerSeasonSolveRequest,
  SchedulerRunState,
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
  createSchedulerLeagueExclusion,
  createSchedulerSeasonExclusion,
  createSchedulerTeamExclusion,
  createSchedulerUmpireExclusion,
  deleteSchedulerLeagueExclusion,
  deleteSchedulerSeasonExclusion,
  deleteSchedulerTeamExclusion,
  deleteSchedulerUmpireExclusion,
  enqueueSeasonScheduleRun,
  generateSeasonMatchups,
  getSeasonScheduleRun,
  getSchedulerProblemSpecPreview,
  getSchedulerSeasonWindowConfig,
  listSchedulerLeagueExclusions,
  listSchedulerSeasonExclusions,
  listSchedulerTeamExclusions,
  listSchedulerUmpireExclusions,
  solveSeasonSchedule,
  upsertSchedulerSeasonWindowConfig,
  updateSchedulerLeagueExclusion,
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
    signal?: AbortSignal,
  ): Promise<SchedulerSeasonWindowConfig | null> {
    const result = await getSchedulerSeasonWindowConfig({
      client: this.client,
      path: { accountId, seasonId },
      signal,
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

  async enqueueSeasonRun(
    accountId: string,
    seasonId: string,
    request: SchedulerSeasonSolveRequest,
    options?: { idempotencyKey?: string },
  ): Promise<SchedulerRunState> {
    const result = await enqueueSeasonScheduleRun({
      client: this.client,
      path: { accountId, seasonId },
      body: request,
      headers: options?.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : undefined,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to queue schedule generation');
  }

  async getSeasonRun(
    accountId: string,
    seasonId: string,
    runId: string,
    signal?: AbortSignal,
  ): Promise<SchedulerRunState> {
    const result = await getSeasonScheduleRun({
      client: this.client,
      path: { accountId, seasonId, runId },
      signal,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to load schedule run status');
  }

  async generateSeasonMatchups(
    accountId: string,
    seasonId: string,
    request: SchedulerGenerateMatchupsRequest,
  ): Promise<SchedulerGenerateMatchupsResult> {
    const result = await generateSeasonMatchups({
      client: this.client,
      path: { accountId, seasonId },
      body: request,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to generate matchups');
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

  async listSeasonExclusions(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<SchedulerSeasonExclusion[]> {
    const result = await listSchedulerSeasonExclusions({
      client: this.client,
      path: { accountId, seasonId },
      signal,
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

  async listTeamExclusions(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<SchedulerTeamExclusion[]> {
    const result = await listSchedulerTeamExclusions({
      client: this.client,
      path: { accountId, seasonId },
      signal,
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

  async listLeagueExclusions(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<SchedulerLeagueExclusion[]> {
    const result = await listSchedulerLeagueExclusions({
      client: this.client,
      path: { accountId, seasonId },
      signal,
      throwOnError: false,
    });

    const payload: SchedulerLeagueExclusions = unwrapApiResult(
      result,
      'Failed to load league exclusions',
    );
    return payload.exclusions;
  }

  async createLeagueExclusion(
    accountId: string,
    seasonId: string,
    input: SchedulerLeagueExclusionUpsert,
  ): Promise<SchedulerLeagueExclusion> {
    const result = await createSchedulerLeagueExclusion({
      client: this.client,
      path: { accountId, seasonId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to create league exclusion');
  }

  async updateLeagueExclusion(
    accountId: string,
    seasonId: string,
    exclusionId: string,
    input: SchedulerLeagueExclusionUpsert,
  ): Promise<SchedulerLeagueExclusion> {
    const result = await updateSchedulerLeagueExclusion({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      body: input,
      throwOnError: false,
    });

    return unwrapApiResult(result, 'Failed to update league exclusion');
  }

  async deleteLeagueExclusion(
    accountId: string,
    seasonId: string,
    exclusionId: string,
  ): Promise<void> {
    const result = await deleteSchedulerLeagueExclusion({
      client: this.client,
      path: { accountId, seasonId, exclusionId },
      throwOnError: false,
    });

    unwrapApiResult(result, 'Failed to delete league exclusion');
  }

  async listUmpireExclusions(
    accountId: string,
    seasonId: string,
    signal?: AbortSignal,
  ): Promise<SchedulerUmpireExclusion[]> {
    const result = await listSchedulerUmpireExclusions({
      client: this.client,
      path: { accountId, seasonId },
      signal,
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
}
