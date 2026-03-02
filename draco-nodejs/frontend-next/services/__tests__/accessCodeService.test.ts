import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getTeamsWantedByAccessCode as apiGetTeamsWanted } from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { accessCodeService } from '../accessCodeService';

vi.mock('@draco/shared-api-client', () => ({
  getTeamsWantedByAccessCode: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

vi.mock('../../utils/accessCodeValidation', () => ({
  validateAccessCode: vi.fn(),
  checkRateLimit: vi.fn(),
  recordAttempt: vi.fn(),
  resetRateLimit: vi.fn(),
  getAllRateLimitTracking: vi.fn(),
}));

import {
  validateAccessCode,
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  getAllRateLimitTracking,
} from '../../utils/accessCodeValidation';

const ACCOUNT_ID = 'account-5';
const VALID_CODE = '550e8400-e29b-41d4-a716-446655440000';

const classified = {
  id: 'classifieds-1',
  accountId: ACCOUNT_ID,
  dateCreated: '2025-01-01T00:00:00Z',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-1234',
  experience: 'Intermediate',
  positionsPlayed: 'Pitcher',
  birthDate: '1990-06-15',
  age: 34,
  notifyOptOut: false,
  account: { id: ACCOUNT_ID, name: 'Spring League' },
};

type ApiGetTeamsWantedResult = Awaited<ReturnType<typeof apiGetTeamsWanted>>;

const makeOk = (data: ApiGetTeamsWantedResult['data']) =>
  ({
    data,
    request: {} as Request,
    response: {} as Response,
  }) as ApiGetTeamsWantedResult;

const makeError = (message: string, status = 400) =>
  ({
    data: undefined,
    error: { message, statusCode: status },
    request: {} as Request,
    response: { status } as Response,
  }) as ApiGetTeamsWantedResult;

describe('accessCodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(checkRateLimit).mockReturnValue({
      attemptsRemaining: 5,
      resetTime: new Date(Date.now() + 60_000),
      isBlocked: false,
    });

    vi.mocked(validateAccessCode).mockReturnValue({
      isValid: true,
      sanitizedValue: VALID_CODE,
    });
  });

  describe('verifyAccessCode', () => {
    it('returns success with classified data when access code is valid', async () => {
      vi.mocked(apiGetTeamsWanted).mockResolvedValue(makeOk(classified));

      const result = await accessCodeService.verifyAccessCode(ACCOUNT_ID, VALID_CODE);

      expect(validateAccessCode).toHaveBeenCalledWith(VALID_CODE);
      expect(checkRateLimit).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(apiGetTeamsWanted).toHaveBeenCalledWith({
        client: expect.anything(),
        path: { accountId: ACCOUNT_ID },
        body: { accessCode: VALID_CODE },
        throwOnError: false,
      });
      expect(recordAttempt).toHaveBeenCalledWith(ACCOUNT_ID, true);
      expect(result.success).toBe(true);
      expect(result.classified).toEqual(classified);
      expect(result.message).toBe('Access code verified successfully');
    });

    it('returns an error response when format validation fails', async () => {
      vi.mocked(validateAccessCode).mockReturnValue({
        isValid: false,
        error: 'Access code must be exactly 36 characters long',
      });

      const result = await accessCodeService.verifyAccessCode(ACCOUNT_ID, 'bad-code');

      expect(apiGetTeamsWanted).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.message).toContain('36 characters');
    });

    it('returns a rate-limited response when the account is blocked', async () => {
      vi.mocked(checkRateLimit).mockReturnValue({
        attemptsRemaining: 0,
        resetTime: new Date(Date.now() + 300_000),
        isBlocked: true,
      });

      const result = await accessCodeService.verifyAccessCode(ACCOUNT_ID, VALID_CODE);

      expect(apiGetTeamsWanted).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('RATE_LIMITED');
    });

    it('records a failed attempt and returns a network error on ApiClientError', async () => {
      vi.mocked(apiGetTeamsWanted).mockResolvedValue(makeError('Not found', 404));

      const result = await accessCodeService.verifyAccessCode(ACCOUNT_ID, VALID_CODE);

      expect(recordAttempt).toHaveBeenCalledWith(ACCOUNT_ID, false);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('API_ERROR');
    });

    it('handles an ApiClientError with a custom errorCode in details', async () => {
      vi.mocked(apiGetTeamsWanted).mockImplementation(() => {
        throw new ApiClientError('Access code not found', {
          status: 404,
          details: { errorCode: 'CODE_NOT_FOUND' },
        });
      });

      const result = await accessCodeService.verifyAccessCode(ACCOUNT_ID, VALID_CODE);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CODE_NOT_FOUND');
      expect(result.message).toBe('Access code not found');
    });

    it('handles a generic Error thrown by the API call', async () => {
      vi.mocked(apiGetTeamsWanted).mockImplementation(() => {
        throw new Error('Network failure');
      });

      const result = await accessCodeService.verifyAccessCode(ACCOUNT_ID, VALID_CODE);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
      expect(result.message).toBe('Network failure');
    });
  });

  describe('getRateLimitInfo', () => {
    it('returns the rate limit information from the validation utility', () => {
      const info = {
        attemptsRemaining: 3,
        resetTime: new Date(Date.now() + 60_000),
        isBlocked: false,
      };
      vi.mocked(checkRateLimit).mockReturnValue(info);

      const result = accessCodeService.getRateLimitInfo(ACCOUNT_ID);

      expect(checkRateLimit).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(result).toEqual(info);
    });
  });

  describe('resetRateLimit', () => {
    it('delegates to the validation utility', () => {
      accessCodeService.resetRateLimit(ACCOUNT_ID);

      expect(resetRateLimit).toHaveBeenCalledWith(ACCOUNT_ID);
    });
  });

  describe('getAllRateLimitTracking', () => {
    it('returns the full tracking data from the utility', () => {
      const tracking = [
        {
          accountId: ACCOUNT_ID,
          attempts: 2,
          lastAttempt: new Date(),
          isBlocked: false,
        },
      ];
      vi.mocked(getAllRateLimitTracking).mockReturnValue(tracking);

      const result = accessCodeService.getAllRateLimitTracking();

      expect(getAllRateLimitTracking).toHaveBeenCalled();
      expect(result).toEqual(tracking);
    });
  });
});
