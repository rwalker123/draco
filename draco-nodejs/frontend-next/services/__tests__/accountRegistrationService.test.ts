import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getCurrentUserContact,
  registerContact,
  selfRegisterContact,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { AccountRegistrationService } from '../accountRegistrationService';

vi.mock('@draco/shared-api-client', () => ({
  getCurrentUserContact: vi.fn(),
  registerContact: vi.fn(),
  selfRegisterContact: vi.fn(),
}));

vi.mock('../../lib/apiClientFactory', () => ({
  createApiClient: vi.fn(() => ({})),
}));

vi.mock('../contactTransformationService', () => ({
  ContactTransformationService: {
    transformBackendContact: vi.fn((contact) => ({
      id: contact.id ?? '',
      firstName: contact.firstName ?? '',
      lastName: contact.lastName ?? '',
      middleName: contact.middleName ?? '',
      email: contact.email ?? '',
      userId: '',
      contactDetails: {},
      contactroles: [],
    })),
  },
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
    error: { message, statusCode },
    request: {} as Request,
    response: { status: statusCode } as Response,
  }) as never;

const ACCOUNT_ID = 'acc-5';
const TOKEN = 'bearer-xyz';

const backendContact = {
  id: 'c-10',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
};

describe('AccountRegistrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchMyContact', () => {
    it('returns a transformed contact when found', async () => {
      vi.mocked(getCurrentUserContact).mockResolvedValue(makeOk(backendContact));

      const result = await AccountRegistrationService.fetchMyContact(ACCOUNT_ID, TOKEN);

      expect(getCurrentUserContact).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          throwOnError: false,
        }),
      );
      expect(result).not.toBeNull();
      expect(result?.id).toBe('c-10');
    });

    it('returns null when the API returns a falsy contact body', async () => {
      vi.mocked(getCurrentUserContact).mockResolvedValue(makeOk(null));

      const result = await AccountRegistrationService.fetchMyContact(ACCOUNT_ID, TOKEN);
      expect(result).toBeNull();
    });

    it('returns null on 401 response', async () => {
      vi.mocked(getCurrentUserContact).mockResolvedValue(makeError('Unauthorized', 401));

      const result = await AccountRegistrationService.fetchMyContact(ACCOUNT_ID, TOKEN);
      expect(result).toBeNull();
    });

    it('returns null on 403 response', async () => {
      vi.mocked(getCurrentUserContact).mockResolvedValue(makeError('Forbidden', 403));

      const result = await AccountRegistrationService.fetchMyContact(ACCOUNT_ID, TOKEN);
      expect(result).toBeNull();
    });

    it('returns null on 404 response', async () => {
      vi.mocked(getCurrentUserContact).mockResolvedValue(makeError('Not found', 404));

      const result = await AccountRegistrationService.fetchMyContact(ACCOUNT_ID, TOKEN);
      expect(result).toBeNull();
    });

    it('re-throws ApiClientError for non-auth error codes', async () => {
      vi.mocked(getCurrentUserContact).mockResolvedValue(makeError('Server error', 500));

      await expect(
        AccountRegistrationService.fetchMyContact(ACCOUNT_ID, TOKEN),
      ).rejects.toBeInstanceOf(ApiClientError);
    });

    it('passes the AbortSignal to the API call', async () => {
      vi.mocked(getCurrentUserContact).mockResolvedValue(makeOk(backendContact));

      const controller = new AbortController();
      await AccountRegistrationService.fetchMyContact(ACCOUNT_ID, TOKEN, controller.signal);

      expect(vi.mocked(getCurrentUserContact).mock.calls[0][0].signal).toBe(controller.signal);
    });
  });

  describe('selfRegister', () => {
    it('self-registers and returns a transformed contact', async () => {
      const registered = { contact: backendContact };
      vi.mocked(selfRegisterContact).mockResolvedValue(makeOk(registered));

      const result = await AccountRegistrationService.selfRegister(
        ACCOUNT_ID,
        { firstName: 'Alice', lastName: 'Smith' },
        TOKEN,
      );

      expect(selfRegisterContact).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          body: expect.objectContaining({ firstName: 'Alice', lastName: 'Smith' }),
          throwOnError: false,
        }),
      );
      expect(result.id).toBe('c-10');
    });

    it('includes streetAddress in contactDetails when validationType is streetAddress', async () => {
      vi.mocked(selfRegisterContact).mockResolvedValue(makeOk({ contact: backendContact }));

      await AccountRegistrationService.selfRegister(
        ACCOUNT_ID,
        {
          firstName: 'Alice',
          lastName: 'Smith',
          validationType: 'streetAddress',
          streetAddress: '123 Main St',
        },
        TOKEN,
      );

      const body = vi.mocked(selfRegisterContact).mock.calls[0][0].body;
      expect(body!.contactDetails?.streetAddress).toBe('123 Main St');
    });

    it('includes dateOfBirth in contactDetails when validationType is dateOfBirth', async () => {
      vi.mocked(selfRegisterContact).mockResolvedValue(makeOk({ contact: backendContact }));

      await AccountRegistrationService.selfRegister(
        ACCOUNT_ID,
        {
          firstName: 'Alice',
          lastName: 'Smith',
          validationType: 'dateOfBirth',
          dateOfBirth: '1990-01-15',
        },
        TOKEN,
      );

      const body = vi.mocked(selfRegisterContact).mock.calls[0][0].body;
      expect(body!.contactDetails?.dateOfBirth).toBe('1990-01-15');
    });

    it('throws an Error (not ApiClientError) wrapping API error message on failure', async () => {
      vi.mocked(selfRegisterContact).mockResolvedValue(makeError('Validation failed', 422));

      await expect(
        AccountRegistrationService.selfRegister(
          ACCOUNT_ID,
          { firstName: 'X', lastName: 'Y' },
          TOKEN,
        ),
      ).rejects.toBeInstanceOf(Error);
    });

    it('throws when registered contact is missing from the response', async () => {
      vi.mocked(selfRegisterContact).mockResolvedValue(makeOk({ contact: null }));

      await expect(
        AccountRegistrationService.selfRegister(
          ACCOUNT_ID,
          { firstName: 'X', lastName: 'Y' },
          TOKEN,
        ),
      ).rejects.toThrow('Registration failed');
    });
  });

  describe('combinedRegister', () => {
    it('registers a new user and returns contact with token', async () => {
      const registered = { token: 'jwt-abc', contact: backendContact };
      vi.mocked(registerContact).mockResolvedValue(makeOk(registered));

      const result = await AccountRegistrationService.combinedRegister(
        ACCOUNT_ID,
        {
          mode: 'newUser',
          email: 'alice@example.com',
          password: 'pass123', // pragma: allowlist secret // pragma: allowlist secret
          firstName: 'Alice',
          lastName: 'Smith',
        },
        'captcha-tok',
      );

      expect(registerContact).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { accountId: ACCOUNT_ID },
          query: { mode: 'newUser' },
          headers: expect.objectContaining({ 'cf-turnstile-token': 'captcha-tok' }),
          throwOnError: false,
        }),
      );
      expect(result.token).toBe('jwt-abc');
      expect(result.contact.id).toBe('c-10');
    });

    it('sends userName as usernameOrEmail for existingUser mode', async () => {
      vi.mocked(registerContact).mockResolvedValue(makeOk({ contact: backendContact }));

      await AccountRegistrationService.combinedRegister(ACCOUNT_ID, {
        mode: 'existingUser',
        usernameOrEmail: 'alice',
        password: 'pass123', // pragma: allowlist secret
        firstName: 'Alice',
      });

      const body = vi.mocked(registerContact).mock.calls[0][0].body;
      expect(body!.userName).toBe('alice');
      expect(body!.email).toBeUndefined();
    });

    it('sends userName as email for newUser mode', async () => {
      vi.mocked(registerContact).mockResolvedValue(makeOk({ contact: backendContact }));

      await AccountRegistrationService.combinedRegister(ACCOUNT_ID, {
        mode: 'newUser',
        email: 'alice@example.com',
        password: 'pass123', // pragma: allowlist secret
        firstName: 'Alice',
        lastName: 'Smith',
      });

      const body = vi.mocked(registerContact).mock.calls[0][0].body;
      expect(body!.email).toBe('alice@example.com');
      expect(body!.userName).toBe('alice@example.com');
    });

    it('throws when registered contact is absent from response', async () => {
      vi.mocked(registerContact).mockResolvedValue(makeOk({ contact: null }));

      await expect(
        AccountRegistrationService.combinedRegister(ACCOUNT_ID, {
          mode: 'newUser',
          email: 'alice@example.com',
          password: 'pass123', // pragma: allowlist secret
          firstName: 'Alice',
          lastName: 'Smith',
        }),
      ).rejects.toThrow('Registration failed');
    });

    it('throws ApiClientError when the API errors', async () => {
      vi.mocked(registerContact).mockResolvedValue(makeError('Conflict', 409));

      await expect(
        AccountRegistrationService.combinedRegister(ACCOUNT_ID, {
          mode: 'newUser',
          email: 'x@x.com',
          password: 'p', // pragma: allowlist secret
          firstName: 'X',
          lastName: 'Y',
        }),
      ).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});
