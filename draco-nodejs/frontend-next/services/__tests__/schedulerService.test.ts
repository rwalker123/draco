import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getSchedulerProblemSpecPreview as apiGetProblemSpec,
  getSchedulerSeasonWindowConfig as apiGetWindowConfig,
  upsertSchedulerSeasonWindowConfig as apiUpsertWindowConfig,
  solveSeasonSchedule as apiSolveSeason,
  applySeasonSchedule as apiApplySeason,
  listSchedulerFieldAvailabilityRules as apiListFieldRules,
  createSchedulerFieldAvailabilityRule as apiCreateFieldRule,
  updateSchedulerFieldAvailabilityRule as apiUpdateFieldRule,
  deleteSchedulerFieldAvailabilityRule as apiDeleteFieldRule,
  listSchedulerFieldExclusionDates as apiListFieldExclusions,
  createSchedulerFieldExclusionDate as apiCreateFieldExclusion,
  updateSchedulerFieldExclusionDate as apiUpdateFieldExclusion,
  deleteSchedulerFieldExclusionDate as apiDeleteFieldExclusion,
  listSchedulerSeasonExclusions as apiListSeasonExclusions,
  createSchedulerSeasonExclusion as apiCreateSeasonExclusion,
  updateSchedulerSeasonExclusion as apiUpdateSeasonExclusion,
  deleteSchedulerSeasonExclusion as apiDeleteSeasonExclusion,
  listSchedulerTeamExclusions as apiListTeamExclusions,
  createSchedulerTeamExclusion as apiCreateTeamExclusion,
  updateSchedulerTeamExclusion as apiUpdateTeamExclusion,
  deleteSchedulerTeamExclusion as apiDeleteTeamExclusion,
  listSchedulerUmpireExclusions as apiListUmpireExclusions,
  createSchedulerUmpireExclusion as apiCreateUmpireExclusion,
  updateSchedulerUmpireExclusion as apiUpdateUmpireExclusion,
  deleteSchedulerUmpireExclusion as apiDeleteUmpireExclusion,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { SchedulerService } from '../schedulerService';
import type { Client } from '@draco/shared-api-client/generated/client';

vi.mock('@draco/shared-api-client', () => ({
  getSchedulerProblemSpecPreview: vi.fn(),
  getSchedulerSeasonWindowConfig: vi.fn(),
  upsertSchedulerSeasonWindowConfig: vi.fn(),
  solveSeasonSchedule: vi.fn(),
  applySeasonSchedule: vi.fn(),
  listSchedulerFieldAvailabilityRules: vi.fn(),
  createSchedulerFieldAvailabilityRule: vi.fn(),
  updateSchedulerFieldAvailabilityRule: vi.fn(),
  deleteSchedulerFieldAvailabilityRule: vi.fn(),
  listSchedulerFieldExclusionDates: vi.fn(),
  createSchedulerFieldExclusionDate: vi.fn(),
  updateSchedulerFieldExclusionDate: vi.fn(),
  deleteSchedulerFieldExclusionDate: vi.fn(),
  listSchedulerSeasonExclusions: vi.fn(),
  createSchedulerSeasonExclusion: vi.fn(),
  updateSchedulerSeasonExclusion: vi.fn(),
  deleteSchedulerSeasonExclusion: vi.fn(),
  listSchedulerTeamExclusions: vi.fn(),
  createSchedulerTeamExclusion: vi.fn(),
  updateSchedulerTeamExclusion: vi.fn(),
  deleteSchedulerTeamExclusion: vi.fn(),
  listSchedulerUmpireExclusions: vi.fn(),
  createSchedulerUmpireExclusion: vi.fn(),
  updateSchedulerUmpireExclusion: vi.fn(),
  deleteSchedulerUmpireExclusion: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

const ACCOUNT_ID = 'account-3';
const SEASON_ID = 'season-1';

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, status = 400) =>
  ({
    data: undefined,
    error: { message, statusCode: status },
    request: {} as Request,
    response: { status } as Response,
  }) as never;

describe('SchedulerService', () => {
  let service: SchedulerService;
  let client: Client;

  beforeEach(() => {
    vi.clearAllMocks();
    client = {} as Client;
    service = new SchedulerService(undefined, client);
  });

  describe('getProblemSpecPreview', () => {
    it('fetches and returns the problem spec preview', async () => {
      const preview = { teams: 8, fields: 3, games: 56 };
      vi.mocked(apiGetProblemSpec).mockResolvedValue(makeOk(preview));

      const result = await service.getProblemSpecPreview(ACCOUNT_ID, SEASON_ID);

      expect(apiGetProblemSpec).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID },
        throwOnError: false,
      });
      expect(result).toEqual(preview);
    });

    it('throws ApiClientError on failure', async () => {
      vi.mocked(apiGetProblemSpec).mockResolvedValue(makeError('Not found', 404));

      await expect(service.getProblemSpecPreview(ACCOUNT_ID, SEASON_ID)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('getSeasonWindowConfig', () => {
    it('returns the window config when it exists', async () => {
      const config = { id: 'wc-1', startDate: '2025-03-01', endDate: '2025-06-30' };
      vi.mocked(apiGetWindowConfig).mockResolvedValue(makeOk(config));

      const result = await service.getSeasonWindowConfig(ACCOUNT_ID, SEASON_ID);

      expect(result).toEqual(config);
    });

    it('returns null when the config does not exist (404)', async () => {
      vi.mocked(apiGetWindowConfig).mockResolvedValue(makeError('Not found', 404));

      const result = await service.getSeasonWindowConfig(ACCOUNT_ID, SEASON_ID);

      expect(result).toBeNull();
    });

    it('re-throws non-404 errors', async () => {
      vi.mocked(apiGetWindowConfig).mockResolvedValue(makeError('Server Error', 500));

      await expect(service.getSeasonWindowConfig(ACCOUNT_ID, SEASON_ID)).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });

  describe('upsertSeasonWindowConfig', () => {
    it('upserts and returns the window config', async () => {
      const config = { id: 'wc-1', startDate: '2025-03-01', endDate: '2025-06-30' };
      vi.mocked(apiUpsertWindowConfig).mockResolvedValue(makeOk(config));

      const input = { startDate: '2025-03-01', endDate: '2025-06-30' } as never;
      const result = await service.upsertSeasonWindowConfig(ACCOUNT_ID, SEASON_ID, input);

      expect(apiUpsertWindowConfig).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID },
        body: input,
        throwOnError: false,
      });
      expect(result).toEqual(config);
    });
  });

  describe('solveSeason', () => {
    it('sends the solve request with an idempotency key when provided', async () => {
      const solveResult = { proposalId: 'proposal-1', status: 'solved' };
      vi.mocked(apiSolveSeason).mockResolvedValue(makeOk(solveResult));

      const request = { algorithm: 'greedy' } as never;
      const result = await service.solveSeason(ACCOUNT_ID, SEASON_ID, request, {
        idempotencyKey: 'idem-key-1',
      });

      expect(apiSolveSeason).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID },
        body: request,
        headers: { 'Idempotency-Key': 'idem-key-1' },
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).proposalId).toBe('proposal-1');
    });

    it('sends undefined headers when no idempotency key is supplied', async () => {
      vi.mocked(apiSolveSeason).mockResolvedValue(makeOk({ proposalId: 'p-2', status: 'solved' }));

      await service.solveSeason(ACCOUNT_ID, SEASON_ID, {} as never);

      expect(apiSolveSeason).toHaveBeenCalledWith(expect.objectContaining({ headers: undefined }));
    });
  });

  describe('applySeason', () => {
    it('applies a schedule proposal and returns the result', async () => {
      const applyResult = { applied: true, gamesCreated: 56 };
      vi.mocked(apiApplySeason).mockResolvedValue(makeOk(applyResult));

      const request = { proposalId: 'proposal-1' } as never;
      const result = await service.applySeason(ACCOUNT_ID, SEASON_ID, request);

      expect(apiApplySeason).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID },
        body: request,
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).gamesCreated).toBe(56);
    });
  });

  describe('listFieldAvailabilityRules', () => {
    it('returns the rules array from the API response', async () => {
      const rule = { id: 'rule-1', fieldId: 'field-1', dayOfWeek: 'Monday' };
      vi.mocked(apiListFieldRules).mockResolvedValue(makeOk({ rules: [rule] }));

      const result = await service.listFieldAvailabilityRules(ACCOUNT_ID, SEASON_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rule-1');
    });

    it('throws on API error', async () => {
      vi.mocked(apiListFieldRules).mockResolvedValue(makeError('Server Error', 500));

      await expect(
        service.listFieldAvailabilityRules(ACCOUNT_ID, SEASON_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('createFieldAvailabilityRule', () => {
    it('creates a rule and returns the new record', async () => {
      const rule = { id: 'rule-2', fieldId: 'field-1', dayOfWeek: 'Tuesday' };
      vi.mocked(apiCreateFieldRule).mockResolvedValue(makeOk(rule));

      const input = { fieldId: 'field-1', dayOfWeek: 'Tuesday' } as never;
      const result = await service.createFieldAvailabilityRule(ACCOUNT_ID, SEASON_ID, input);

      expect(apiCreateFieldRule).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID },
        body: input,
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).dayOfWeek).toBe('Tuesday');
    });
  });

  describe('updateFieldAvailabilityRule', () => {
    it('updates a rule and returns the updated record', async () => {
      const updated = { id: 'rule-1', fieldId: 'field-1', dayOfWeek: 'Wednesday' };
      vi.mocked(apiUpdateFieldRule).mockResolvedValue(makeOk(updated));

      const result = await service.updateFieldAvailabilityRule(ACCOUNT_ID, SEASON_ID, 'rule-1', {
        dayOfWeek: 'Wednesday',
      } as never);

      expect(apiUpdateFieldRule).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID, ruleId: 'rule-1' },
        body: { dayOfWeek: 'Wednesday' },
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).dayOfWeek).toBe('Wednesday');
    });
  });

  describe('deleteFieldAvailabilityRule', () => {
    it('deletes a rule without error', async () => {
      vi.mocked(apiDeleteFieldRule).mockResolvedValue(makeOk(null));

      await expect(
        service.deleteFieldAvailabilityRule(ACCOUNT_ID, SEASON_ID, 'rule-1'),
      ).resolves.toBeUndefined();

      expect(apiDeleteFieldRule).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID, ruleId: 'rule-1' },
        throwOnError: false,
      });
    });
  });

  describe('listFieldExclusionDates', () => {
    it('returns the exclusions array from the API response', async () => {
      const exclusion = { id: 'ex-1', fieldId: 'field-1', date: '2025-04-01' };
      vi.mocked(apiListFieldExclusions).mockResolvedValue(makeOk({ exclusions: [exclusion] }));

      const result = await service.listFieldExclusionDates(ACCOUNT_ID, SEASON_ID);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2025-04-01');
    });
  });

  describe('createFieldExclusionDate', () => {
    it('creates an exclusion and returns the new record', async () => {
      const exclusion = { id: 'ex-2', fieldId: 'field-2', date: '2025-05-01' };
      vi.mocked(apiCreateFieldExclusion).mockResolvedValue(makeOk(exclusion));

      const input = { fieldId: 'field-2', date: '2025-05-01' } as never;
      const result = await service.createFieldExclusionDate(ACCOUNT_ID, SEASON_ID, input);

      expect(apiCreateFieldExclusion).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID },
        body: input,
        throwOnError: false,
      });
      expect(result.date).toBe('2025-05-01');
    });
  });

  describe('updateFieldExclusionDate', () => {
    it('updates an exclusion and returns the updated record', async () => {
      const updated = { id: 'ex-1', fieldId: 'field-1', date: '2025-04-15' };
      vi.mocked(apiUpdateFieldExclusion).mockResolvedValue(makeOk(updated));

      const result = await service.updateFieldExclusionDate(ACCOUNT_ID, SEASON_ID, 'ex-1', {
        date: '2025-04-15',
      } as never);

      expect(apiUpdateFieldExclusion).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID, exclusionId: 'ex-1' },
        body: { date: '2025-04-15' },
        throwOnError: false,
      });
      expect(result.date).toBe('2025-04-15');
    });
  });

  describe('deleteFieldExclusionDate', () => {
    it('deletes an exclusion without error', async () => {
      vi.mocked(apiDeleteFieldExclusion).mockResolvedValue(makeOk(null));

      await expect(
        service.deleteFieldExclusionDate(ACCOUNT_ID, SEASON_ID, 'ex-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('season exclusions', () => {
    it('lists season exclusions from the exclusions array', async () => {
      const ex = { id: 'sex-1', date: '2025-07-04', reason: 'Holiday' };
      vi.mocked(apiListSeasonExclusions).mockResolvedValue(makeOk({ exclusions: [ex] }));

      const result = await service.listSeasonExclusions(ACCOUNT_ID, SEASON_ID);

      expect(result).toHaveLength(1);
      expect((result[0] as Record<string, unknown>).reason).toBe('Holiday');
    });

    it('creates a season exclusion', async () => {
      const ex = { id: 'sex-2', date: '2025-12-25', reason: 'Christmas' };
      vi.mocked(apiCreateSeasonExclusion).mockResolvedValue(makeOk(ex));

      const result = await service.createSeasonExclusion(ACCOUNT_ID, SEASON_ID, {
        date: '2025-12-25',
        reason: 'Christmas',
      } as never);

      expect(apiCreateSeasonExclusion).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID },
        body: { date: '2025-12-25', reason: 'Christmas' },
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).reason).toBe('Christmas');
    });

    it('updates a season exclusion', async () => {
      const updated = { id: 'sex-1', date: '2025-07-04', reason: 'Independence Day' };
      vi.mocked(apiUpdateSeasonExclusion).mockResolvedValue(makeOk(updated));

      const result = await service.updateSeasonExclusion(ACCOUNT_ID, SEASON_ID, 'sex-1', {
        reason: 'Independence Day',
      } as never);

      expect(apiUpdateSeasonExclusion).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID, exclusionId: 'sex-1' },
        body: { reason: 'Independence Day' },
        throwOnError: false,
      });
      expect((result as Record<string, unknown>).reason).toBe('Independence Day');
    });

    it('deletes a season exclusion', async () => {
      vi.mocked(apiDeleteSeasonExclusion).mockResolvedValue(makeOk(null));

      await expect(
        service.deleteSeasonExclusion(ACCOUNT_ID, SEASON_ID, 'sex-1'),
      ).resolves.toBeUndefined();

      expect(apiDeleteSeasonExclusion).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID, exclusionId: 'sex-1' },
        throwOnError: false,
      });
    });
  });

  describe('team exclusions', () => {
    it('lists team exclusions from the exclusions array', async () => {
      const ex = { id: 'tex-1', teamId: 'team-1', date: '2025-04-10' };
      vi.mocked(apiListTeamExclusions).mockResolvedValue(makeOk({ exclusions: [ex] }));

      const result = await service.listTeamExclusions(ACCOUNT_ID, SEASON_ID);

      expect(result).toHaveLength(1);
      expect((result[0] as Record<string, unknown>).teamId).toBe('team-1');
    });

    it('creates a team exclusion', async () => {
      const ex = { id: 'tex-2', teamId: 'team-2', date: '2025-04-20' };
      vi.mocked(apiCreateTeamExclusion).mockResolvedValue(makeOk(ex));

      const result = await service.createTeamExclusion(ACCOUNT_ID, SEASON_ID, {
        teamId: 'team-2',
        date: '2025-04-20',
      } as never);

      expect((result as Record<string, unknown>).teamId).toBe('team-2');
    });

    it('updates a team exclusion', async () => {
      const updated = { id: 'tex-1', teamId: 'team-1', date: '2025-04-11' };
      vi.mocked(apiUpdateTeamExclusion).mockResolvedValue(makeOk(updated));

      const result = await service.updateTeamExclusion(ACCOUNT_ID, SEASON_ID, 'tex-1', {
        date: '2025-04-11',
      } as never);

      expect((result as Record<string, unknown>).date).toBe('2025-04-11');
    });

    it('deletes a team exclusion', async () => {
      vi.mocked(apiDeleteTeamExclusion).mockResolvedValue(makeOk(null));

      await expect(
        service.deleteTeamExclusion(ACCOUNT_ID, SEASON_ID, 'tex-1'),
      ).resolves.toBeUndefined();

      expect(apiDeleteTeamExclusion).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID, exclusionId: 'tex-1' },
        throwOnError: false,
      });
    });
  });

  describe('umpire exclusions', () => {
    it('lists umpire exclusions from the exclusions array', async () => {
      const ex = { id: 'uex-1', umpireId: 'umpire-1', date: '2025-05-05' };
      vi.mocked(apiListUmpireExclusions).mockResolvedValue(makeOk({ exclusions: [ex] }));

      const result = await service.listUmpireExclusions(ACCOUNT_ID, SEASON_ID);

      expect(result).toHaveLength(1);
      expect((result[0] as Record<string, unknown>).umpireId).toBe('umpire-1');
    });

    it('creates an umpire exclusion', async () => {
      const ex = { id: 'uex-2', umpireId: 'umpire-2', date: '2025-05-15' };
      vi.mocked(apiCreateUmpireExclusion).mockResolvedValue(makeOk(ex));

      const result = await service.createUmpireExclusion(ACCOUNT_ID, SEASON_ID, {
        umpireId: 'umpire-2',
        date: '2025-05-15',
      } as never);

      expect((result as Record<string, unknown>).umpireId).toBe('umpire-2');
    });

    it('updates an umpire exclusion', async () => {
      const updated = { id: 'uex-1', umpireId: 'umpire-1', date: '2025-05-06' };
      vi.mocked(apiUpdateUmpireExclusion).mockResolvedValue(makeOk(updated));

      const result = await service.updateUmpireExclusion(ACCOUNT_ID, SEASON_ID, 'uex-1', {
        date: '2025-05-06',
      } as never);

      expect((result as Record<string, unknown>).date).toBe('2025-05-06');
    });

    it('deletes an umpire exclusion', async () => {
      vi.mocked(apiDeleteUmpireExclusion).mockResolvedValue(makeOk(null));

      await expect(
        service.deleteUmpireExclusion(ACCOUNT_ID, SEASON_ID, 'uex-1'),
      ).resolves.toBeUndefined();

      expect(apiDeleteUmpireExclusion).toHaveBeenCalledWith({
        client,
        path: { accountId: ACCOUNT_ID, seasonId: SEASON_ID, exclusionId: 'uex-1' },
        throwOnError: false,
      });
    });
  });
});
