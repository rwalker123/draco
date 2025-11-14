import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  listAccountWelcomeMessages as apiListAccountWelcomeMessages,
  createTeamWelcomeMessage as apiCreateTeamWelcomeMessage,
  deleteTeamWelcomeMessage as apiDeleteTeamWelcomeMessage,
  type AuthorizationError,
} from '@draco/shared-api-client';
import { ApiClientError } from '../../utils/apiResult';
import { WelcomeMessageService } from '../welcomeMessageService';

vi.mock('@draco/shared-api-client', () => ({
  listAccountWelcomeMessages: vi.fn(),
  listTeamWelcomeMessages: vi.fn(),
  getAccountWelcomeMessage: vi.fn(),
  getTeamWelcomeMessage: vi.fn(),
  createAccountWelcomeMessage: vi.fn(),
  createTeamWelcomeMessage: vi.fn(),
  updateAccountWelcomeMessage: vi.fn(),
  updateTeamWelcomeMessage: vi.fn(),
  deleteAccountWelcomeMessage: vi.fn(),
  deleteTeamWelcomeMessage: vi.fn(),
}));

describe('WelcomeMessageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes account welcome messages', async () => {
    vi.mocked(apiListAccountWelcomeMessages).mockResolvedValue({
      data: {
        welcomeMessages: [
          {
            id: '2',
            accountId: '10',
            teamId: '7',
            caption: 'Team hello',
            order: 4,
            bodyHtml: '<p>Hello</p>',
            isTeamScoped: true,
            scope: 'team',
          },
          {
            id: '3',
            accountId: '10',
            caption: 'Account hello',
            order: 1,
            bodyHtml: '',
            isTeamScoped: false,
            scope: 'account',
          },
        ],
      },
      response: {} as Response,
    });

    const service = new WelcomeMessageService(undefined, {} as never);
    const result = await service.listAccountMessages('10');

    expect(result).toEqual([
      {
        id: '2',
        accountId: '10',
        teamId: '7',
        caption: 'Team hello',
        order: 4,
        bodyHtml: '<p>Hello</p>',
        isTeamScoped: true,
        scope: 'team',
      },
      {
        id: '3',
        accountId: '10',
        caption: 'Account hello',
        order: 1,
        bodyHtml: '',
        isTeamScoped: false,
        scope: 'account',
      },
    ]);
  });

  it('creates a team welcome message using the provided team scope', async () => {
    vi.mocked(apiCreateTeamWelcomeMessage).mockResolvedValue({
      data: {
        id: '9',
        accountId: '12',
        teamId: '5',
        caption: 'Greetings',
        order: 2,
        bodyHtml: '<p>Welcome</p>',
        isTeamScoped: true,
        scope: 'team',
      },
      response: {} as Response,
    });

    const service = new WelcomeMessageService(undefined, {} as never);
    const payload = { caption: 'Greetings', order: 2, bodyHtml: '<p>Welcome</p>' };
    const result = await service.createTeamMessage('12', { teamSeasonId: '42' }, payload);

    expect(apiCreateTeamWelcomeMessage).toHaveBeenCalledWith({
      client: expect.anything(),
      path: { accountId: '12', teamSeasonId: '42' },
      body: payload,
      throwOnError: false,
    });
    expect(result).toMatchObject({
      id: '9',
      scope: 'team',
      bodyHtml: '<p>Welcome</p>',
    });
  });

  it('throws when deleting a team message fails', async () => {
    vi.mocked(apiDeleteTeamWelcomeMessage).mockResolvedValue({
      data: undefined,
      error: {
        message: 'Forbidden',
        statusCode: 403,
        isRetryable: false,
      } as AuthorizationError,
      response: {} as Response,
    });

    const service = new WelcomeMessageService(undefined, {} as never);

    await expect(
      service.deleteTeamMessage('12', { teamSeasonId: '5' }, '9'),
    ).rejects.toBeInstanceOf(ApiClientError);
  });
});
