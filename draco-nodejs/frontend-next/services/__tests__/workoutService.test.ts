import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  listAccountWorkouts,
  getAccountWorkout,
  createAccountWorkout,
  updateAccountWorkout,
  deleteAccountWorkout,
  listWorkoutRegistrations as apiListWorkoutRegistrations,
  createWorkoutRegistration as apiCreateWorkoutRegistration,
  updateWorkoutRegistration as apiUpdateWorkoutRegistration,
  deleteWorkoutRegistration as apiDeleteWorkoutRegistration,
  verifyWorkoutRegistration as apiVerifyWorkoutRegistration,
  findWorkoutRegistrationByAccessCode as apiFindWorkoutRegistrationByAccessCode,
  getWorkoutSources as apiGetWorkoutSources,
  updateWorkoutSources as apiUpdateWorkoutSources,
  appendWorkoutSourceOption as apiAppendWorkoutSourceOption,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  listWorkoutRegistrations,
  createWorkoutRegistration,
  updateWorkoutRegistration,
  deleteWorkoutRegistration,
  deleteWorkoutRegistrationByAccessCode,
  verifyWorkoutRegistrationAccess,
  findWorkoutRegistrationByAccessCode,
  getSources,
  putSources,
  appendSourceOption,
} from '../workoutService';

vi.mock('@draco/shared-api-client', () => ({
  listAccountWorkouts: vi.fn(),
  getAccountWorkout: vi.fn(),
  createAccountWorkout: vi.fn(),
  updateAccountWorkout: vi.fn(),
  deleteAccountWorkout: vi.fn(),
  listWorkoutRegistrations: vi.fn(),
  createWorkoutRegistration: vi.fn(),
  updateWorkoutRegistration: vi.fn(),
  deleteWorkoutRegistration: vi.fn(),
  verifyWorkoutRegistration: vi.fn(),
  findWorkoutRegistrationByAccessCode: vi.fn(),
  getWorkoutSources: vi.fn(),
  updateWorkoutSources: vi.fn(),
  appendWorkoutSourceOption: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

vi.mock('../../utils/fieldMapper', () => ({
  mapApiFieldToFieldType: vi.fn((field) => field ?? undefined),
}));

const makeOk = <T>(data: T) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as never;

const makeError = (message: string, statusCode = 400) =>
  ({
    data: undefined,
    error: { message, statusCode, isRetryable: false },
    request: {} as Request,
    response: { status: statusCode } as Response,
  }) as never;

const ACCOUNT_ID = 'acc-42';
const WORKOUT_ID = 'w-7';
const REG_ID = 'reg-3';
const TOKEN = 'tok-abc';

const apiWorkoutSummary = {
  id: WORKOUT_ID,
  workoutDesc: 'Morning drill',
  workoutDate: '2026-03-01',
  registrationCount: 5,
};

const apiWorkout = {
  ...apiWorkoutSummary,
  accountId: ACCOUNT_ID,
  comments: 'Bring cleats',
};

const registration = {
  id: REG_ID,
  workoutId: WORKOUT_ID,
  contactId: 'c-1',
  firstName: 'John',
  lastName: 'Doe',
};

describe('workoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listWorkouts', () => {
    it('returns mapped workout summaries', async () => {
      vi.mocked(listAccountWorkouts).mockResolvedValue(makeOk([apiWorkoutSummary]));

      const result = await listWorkouts(ACCOUNT_ID, true, TOKEN);

      expect(listAccountWorkouts).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          throwOnError: false,
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(WORKOUT_ID);
      expect(result[0].workoutDesc).toBe('Morning drill');
      expect(result[0].registrationCount).toBe(5);
    });

    it('includes query params for status and cursor', async () => {
      vi.mocked(listAccountWorkouts).mockResolvedValue(makeOk([]));

      await listWorkouts(ACCOUNT_ID, false, TOKEN, 'upcoming', {
        after: 'cursor-x',
        limit: 10,
      });

      const call = vi.mocked(listAccountWorkouts).mock.calls[0][0];
      expect(call.query).toMatchObject({ status: 'upcoming', after: 'cursor-x', limit: 10 });
    });

    it('throws ApiClientError when list fails', async () => {
      vi.mocked(listAccountWorkouts).mockResolvedValue(makeError('Server error', 500));
      await expect(listWorkouts(ACCOUNT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('getWorkout', () => {
    it('returns a mapped workout with accountId and comments', async () => {
      vi.mocked(getAccountWorkout).mockResolvedValue(makeOk(apiWorkout));

      const result = await getWorkout(ACCOUNT_ID, WORKOUT_ID, TOKEN);

      expect(result.id).toBe(WORKOUT_ID);
      expect(result.accountId).toBe(ACCOUNT_ID);
      expect(result.comments).toBe('Bring cleats');
    });

    it('throws when workout not found', async () => {
      vi.mocked(getAccountWorkout).mockResolvedValue(makeError('Not found', 404));
      await expect(getWorkout(ACCOUNT_ID, WORKOUT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('createWorkout', () => {
    it('creates and returns the new workout', async () => {
      vi.mocked(createAccountWorkout).mockResolvedValue(makeOk(apiWorkout));

      const dto = { workoutDesc: 'Morning drill', workoutDate: '2026-03-01' };
      const result = await createWorkout(ACCOUNT_ID, dto as never, TOKEN);

      expect(createAccountWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: expect.objectContaining({ workoutDesc: 'Morning drill' }),
          throwOnError: false,
        }),
      );
      expect(result.id).toBe(WORKOUT_ID);
    });

    it('normalizes null fieldId to null in payload', async () => {
      vi.mocked(createAccountWorkout).mockResolvedValue(makeOk(apiWorkout));

      await createWorkout(ACCOUNT_ID, {
        workoutDesc: 'D',
        workoutDate: '2026-01-01',
        fieldId: null,
      } as never);

      const body = vi.mocked(createAccountWorkout).mock.calls[0][0].body;
      expect(body).toHaveProperty('fieldId', null);
    });

    it('omits fieldId from payload when undefined', async () => {
      vi.mocked(createAccountWorkout).mockResolvedValue(makeOk(apiWorkout));

      await createWorkout(ACCOUNT_ID, { workoutDesc: 'D', workoutDate: '2026-01-01' } as never);

      const body = vi.mocked(createAccountWorkout).mock.calls[0][0].body;
      expect(body).not.toHaveProperty('fieldId');
    });
  });

  describe('updateWorkout', () => {
    it('updates and returns the workout', async () => {
      vi.mocked(updateAccountWorkout).mockResolvedValue(makeOk(apiWorkout));

      const dto = { workoutDesc: 'Updated', workoutDate: '2026-03-02' };
      const result = await updateWorkout(ACCOUNT_ID, WORKOUT_ID, dto as never, TOKEN);

      expect(updateAccountWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, workoutId: WORKOUT_ID },
          throwOnError: false,
        }),
      );
      expect(result.id).toBe(WORKOUT_ID);
    });
  });

  describe('deleteWorkout', () => {
    it('resolves without error on success', async () => {
      vi.mocked(deleteAccountWorkout).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await expect(deleteWorkout(ACCOUNT_ID, WORKOUT_ID, TOKEN)).resolves.toBeUndefined();
    });

    it('throws ApiClientError when delete fails', async () => {
      vi.mocked(deleteAccountWorkout).mockResolvedValue(makeError('Forbidden', 403));
      await expect(deleteWorkout(ACCOUNT_ID, WORKOUT_ID)).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('listWorkoutRegistrations', () => {
    it('returns the registrations array', async () => {
      vi.mocked(apiListWorkoutRegistrations).mockResolvedValue(
        makeOk({ registrations: [registration] }),
      );

      const result = await listWorkoutRegistrations(ACCOUNT_ID, WORKOUT_ID, TOKEN);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(REG_ID);
    });

    it('returns empty array when registrations is null', async () => {
      vi.mocked(apiListWorkoutRegistrations).mockResolvedValue(makeOk({ registrations: null }));
      const result = await listWorkoutRegistrations(ACCOUNT_ID, WORKOUT_ID);
      expect(result).toEqual([]);
    });
  });

  describe('createWorkoutRegistration', () => {
    it('creates and returns the registration', async () => {
      vi.mocked(apiCreateWorkoutRegistration).mockResolvedValue(makeOk(registration));

      const dto = { firstName: 'John', lastName: 'Doe', contactId: 'c-1' };
      const result = await createWorkoutRegistration(ACCOUNT_ID, WORKOUT_ID, dto as never, TOKEN);

      expect(result.id).toBe(REG_ID);
    });
  });

  describe('updateWorkoutRegistration', () => {
    it('updates and returns the registration with accessCode merged into payload', async () => {
      vi.mocked(apiUpdateWorkoutRegistration).mockResolvedValue(makeOk(registration));

      const dto = { firstName: 'John', lastName: 'Doe', contactId: 'c-1' };
      await updateWorkoutRegistration(
        ACCOUNT_ID,
        WORKOUT_ID,
        REG_ID,
        dto as never,
        TOKEN,
        'code-xyz',
      );

      const body = vi.mocked(apiUpdateWorkoutRegistration).mock.calls[0][0].body;
      expect(body).toMatchObject({ ...dto, accessCode: 'code-xyz' });
    });
  });

  describe('deleteWorkoutRegistration', () => {
    it('resolves without error on success', async () => {
      vi.mocked(apiDeleteWorkoutRegistration).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await expect(
        deleteWorkoutRegistration(ACCOUNT_ID, WORKOUT_ID, REG_ID, TOKEN),
      ).resolves.toBeUndefined();
    });

    it('throws ApiClientError when delete fails', async () => {
      vi.mocked(apiDeleteWorkoutRegistration).mockResolvedValue(makeError('Not found', 404));
      await expect(
        deleteWorkoutRegistration(ACCOUNT_ID, WORKOUT_ID, REG_ID),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('deleteWorkoutRegistrationByAccessCode', () => {
    it('passes accessCode in the body', async () => {
      vi.mocked(apiDeleteWorkoutRegistration).mockResolvedValue({
        data: undefined,
        request: {} as Request,
        response: {} as Response,
      } as never);

      await deleteWorkoutRegistrationByAccessCode(ACCOUNT_ID, WORKOUT_ID, REG_ID, 'ac-99');

      const call = vi.mocked(apiDeleteWorkoutRegistration).mock.calls[0][0];
      expect(call.body).toEqual({ accessCode: 'ac-99' });
    });
  });

  describe('verifyWorkoutRegistrationAccess', () => {
    it('verifies and returns the registration', async () => {
      vi.mocked(apiVerifyWorkoutRegistration).mockResolvedValue(makeOk(registration));

      const result = await verifyWorkoutRegistrationAccess(
        ACCOUNT_ID,
        WORKOUT_ID,
        REG_ID,
        'code-1',
      );

      expect(apiVerifyWorkoutRegistration).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { accessCode: 'code-1' },
        }),
      );
      expect(result.id).toBe(REG_ID);
    });
  });

  describe('findWorkoutRegistrationByAccessCode', () => {
    it('finds and returns the registration', async () => {
      vi.mocked(apiFindWorkoutRegistrationByAccessCode).mockResolvedValue(makeOk(registration));

      const result = await findWorkoutRegistrationByAccessCode(ACCOUNT_ID, WORKOUT_ID, 'ac-find');

      expect(apiFindWorkoutRegistrationByAccessCode).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID, workoutId: WORKOUT_ID },
          body: { accessCode: 'ac-find' },
        }),
      );
      expect(result.id).toBe(REG_ID);
    });
  });

  describe('getSources', () => {
    it('returns the workout sources', async () => {
      const sources = { options: ['School', 'Club'] };
      vi.mocked(apiGetWorkoutSources).mockResolvedValue(makeOk(sources));

      const result = await getSources(ACCOUNT_ID, TOKEN);

      expect(result).toEqual(sources);
    });
  });

  describe('putSources', () => {
    it('resolves without error on success', async () => {
      vi.mocked(apiUpdateWorkoutSources).mockResolvedValue(makeOk(undefined));

      await expect(putSources(ACCOUNT_ID, { options: ['A'] }, TOKEN)).resolves.toBeUndefined();
    });

    it('throws when update fails', async () => {
      vi.mocked(apiUpdateWorkoutSources).mockResolvedValue(makeError('Bad request', 400));
      await expect(putSources(ACCOUNT_ID, { options: [] })).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('appendSourceOption', () => {
    it('appends an option and returns the updated sources', async () => {
      const updated = { options: ['School', 'Club', 'Pickup'] };
      vi.mocked(apiAppendWorkoutSourceOption).mockResolvedValue(makeOk(updated));

      const result = await appendSourceOption(ACCOUNT_ID, 'Pickup', TOKEN);

      expect(apiAppendWorkoutSourceOption).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: { option: 'Pickup' },
          throwOnError: false,
        }),
      );
      expect(result).toEqual(updated);
    });
  });
});
