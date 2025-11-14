import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWelcomeMessageOperations } from '../useWelcomeMessageOperations';

const listAccountMessages = vi.fn();
const listTeamMessages = vi.fn();
const createAccountMessage = vi.fn();
const createTeamMessage = vi.fn();
const updateAccountMessage = vi.fn();
const updateTeamMessage = vi.fn();
const deleteAccountMessage = vi.fn();
const deleteTeamMessage = vi.fn();

const WelcomeMessageServiceMock = vi.fn().mockImplementation(() => ({
  listAccountMessages,
  listTeamMessages,
  createAccountMessage,
  createTeamMessage,
  updateAccountMessage,
  updateTeamMessage,
  deleteAccountMessage,
  deleteTeamMessage,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ token: 'token-123' })),
}));

vi.mock('../useApiClient', () => ({
  useApiClient: vi.fn(() => ({ key: 'client' })),
}));

vi.mock('../../services/welcomeMessageService', () => ({
  WelcomeMessageService: WelcomeMessageServiceMock,
}));

describe('useWelcomeMessageOperations', () => {
  beforeEach(() => {
    listAccountMessages.mockReset();
    listTeamMessages.mockReset();
    createAccountMessage.mockReset();
    createTeamMessage.mockReset();
    updateAccountMessage.mockReset();
    updateTeamMessage.mockReset();
    deleteAccountMessage.mockReset();
    deleteTeamMessage.mockReset();
    WelcomeMessageServiceMock.mockClear();
  });

  it('lists account welcome messages by default', async () => {
    listAccountMessages.mockResolvedValue([{ id: '1', caption: 'Hi', order: 1 }]);

    const { result } = renderHook(() =>
      useWelcomeMessageOperations({ type: 'account', accountId: 'acc-1' }),
    );

    await act(async () => {
      const messages = await result.current.listMessages();
      expect(messages).toEqual([{ id: '1', caption: 'Hi', order: 1 }]);
    });

    expect(listAccountMessages).toHaveBeenCalledWith('acc-1');
    expect(result.current.loading).toBe(false);
  });

  it('lists team welcome messages when override scope is provided', async () => {
    listTeamMessages.mockResolvedValue([{ id: '2', caption: 'Team', order: 2 }]);

    const { result } = renderHook(() =>
      useWelcomeMessageOperations({ type: 'account', accountId: 'acc-2' }),
    );

    await act(async () => {
      const messages = await result.current.listMessages({
        type: 'team',
        accountId: 'acc-2',
        teamSeasonId: 'team-season-4',
      });
      expect(messages).toEqual([{ id: '2', caption: 'Team', order: 2 }]);
    });

    expect(listTeamMessages).toHaveBeenCalledWith('acc-2', { teamSeasonId: 'team-season-4' });
  });

  it('propagates errors from create operations and exposes the message state', async () => {
    const error = new Error('Unable to create');
    createAccountMessage.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useWelcomeMessageOperations({ type: 'account', accountId: 'acc-3' }),
    );

    await expect(
      act(async () => {
        await result.current.createMessage({ caption: 'Bad', order: 1, bodyHtml: '<p>x</p>' });
      }),
    ).rejects.toThrow('Unable to create');

    expect(result.current.error).toBe('Unable to create');
    expect(result.current.loading).toBe(false);
  });

  it('deletes team scoped messages using the provided override scope', async () => {
    deleteTeamMessage.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useWelcomeMessageOperations({ type: 'account', accountId: 'acc-4' }),
    );

    await act(async () => {
      await result.current.deleteMessage('msg-7', {
        type: 'team',
        accountId: 'acc-4',
        teamSeasonId: 'team-season-9',
      });
    });

    expect(deleteTeamMessage).toHaveBeenCalledWith(
      'acc-4',
      { teamSeasonId: 'team-season-9' },
      'msg-7',
    );
  });

  it('clears error state when clearError is called', async () => {
    const error = new Error('Boom');
    deleteAccountMessage.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useWelcomeMessageOperations({ type: 'account', accountId: 'acc-5' }),
    );

    await expect(
      act(async () => {
        await result.current.deleteMessage('msg-8');
      }),
    ).rejects.toThrow('Boom');

    expect(result.current.error).toBe('Boom');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
